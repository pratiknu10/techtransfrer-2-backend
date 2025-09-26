import json
import boto3
import logging
import asyncio
import pymupdf
from r365prompts import get_system_prompt, get_message_list
import mysql.connector
logger = logging.getLogger()
logger.setLevel(logging.INFO) 
from botocore.exceptions import ClientError
from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
from Crypto.Util.Padding import unpad
from botocore.config import Config
from datetime import datetime

import sys
import time
import re
import os
import base64

lambda_client = boto3.client('lambda')
# client = boto3.client('bedrock-runtime')

config = Config(
   read_timeout=2000
)

client = boto3.client('bedrock-runtime', config=config)

# Constants
REGION_NAME = "us-west-1"
MAX_TOKENS = 200000
MAX_OUTPUT_TOKENS = 4096
MAX_PAGES_INVOKES = 1000  # Max aggregate number of pages across all extraction types

def acess_mdb_details(secret_key):
    print("in access")
    secret_name = secret_key
    region_name = "us-east-1"

    # Create a Secrets Manager client
    session = boto3.session.Session()
    client = session.client(
        service_name='secretsmanager',
        region_name=region_name
    )
    print("exit access")
    try:
        get_secret_value_response = client.get_secret_value(
            SecretId=secret_name
        )
    except ClientError as e:
        raise e

    # Decrypts secret using the associated KMS key.
    secret = json.loads(get_secret_value_response['SecretString'])
    return secret

def encrypt_string_to_string(plain_text, key, iv):
    if not plain_text:
        raise ValueError("plain_text cannot be empty")
    if not key:
        raise ValueError("key cannot be empty")
    if not iv:
        raise ValueError("iv cannot be empty")
    try:
        block_size = 16
        pad = block_size - len(plain_text) % block_size
        plain_text += pad * chr(pad)
        cipher = AES.new(key, AES.MODE_CBC, iv)
        encrypted = cipher.encrypt(plain_text.encode('utf-8'))
        return base64.b64encode(encrypted).decode('utf-8')
    except Exception as e:
        raise e
    

class Extract_Summary():
    def __init__(self,event,context):
        start = time.time()
        try:
            self.sqs_client = boto3.client("sqs", config=config)
            if 'Records' in event:
                sqs_messages = event['Records']
                for message in sqs_messages:
                    # message_body = json.loads(message['body'])
                    #added newly- testing
                    if isinstance(message['body'], dict):
                        message_body = message['body']
                    else:
                        message_body = json.loads(message['body'])
                    self.bucket_name = message_body.get('bucket_name')
                    self.s3_prefix =  message_body.get('s3_prefix')
                    self.template_id= message_body.get("template_id")
                    self.retry = message_body.get('retry')
                    self.file_id = message_body.get('file_id')
                    self.message_content = message_body.get("message")
                    self.case_id = message_body.get("case_id")
                    self.start_index = message_body['start_index']
                    self.end_index = message_body['end_index']
                    self.chunk_no = message_body['chunk_no']
                    self.summary=""
                    self.is_bool=message_body['is_bool']
                    self.update_status_arn =message_body['lambda_arn_update_extraction_status']
            else:
                
                self.bucket_name = event['bucket_name']
                self.s3_prefix = event['s3_prefix']
                self.template_id = event['template_id']
                self.file_id = event['file_id']
                self.retry = event['retry']
                self.case_id = event['case_id']
                self.start_index = event['start_index']
                self.end_index = event['end_index']
                self.chunk_no = event['chunk_no']
                self.is_bool=event['is_bool']
                self.update_status_arn = event['lambda_arn_update_extraction_status'] 
            print("hello")
            # print("print(self.file_id): ",self.file_id)    
            self.summary = ""
            self.history = ""
            self.input_tokens=0
            self.output_tokens=0
            self.retry_count=0
            self.doc_sum_input_tokens = 0
            self.doc_sum_output_tokens = 0
            self.finaldocsum = ""
            self.df = None
            self.context_string=""
            
            print(f"Chunk No: {self.chunk_no}, File ID: {self.file_id}")

            
            # logger.info("in extract_chronological_summary_data")
            self.account_map = {}
            self.account_map['291811068019'] = ["R365-Dev/r365_dev_admin/auroramysql"]
            self.account_map['281153739564'] = ["R365-Dev-Qa/r365_dev_qa_admin/auroramysql"]
            self.account_map['044878795345'] = ["R365-uat/r365_uat_admin/auroramysql"]
            sts_client = boto3.client('sts')
            sts_response = sts_client.get_caller_identity()
            self.account_id = sts_response['Account']
            self.lambda_name = 'Extract-ICD-Codes'
            self.lambda_arn = context.invoked_function_arn
            self.df = None
            rds_key = self.account_map[self.account_id][0]
            
            secrets = acess_mdb_details(rds_key)
            self.mhost_name = secrets['host']
            self.mdb_name = secrets['dbname']
            self.mdb_user_name = secrets['username']
            self.mdb_user_pwd = secrets['password']
            self.mdb_port_no = 3306
            logger.info("secrets completed")
            self.key = secrets['key']
            self.iv = secrets['key']
            self.mdb_port_no = 3306
            self.db_port_no = 3306
            connection1 = mysql.connector.connect(host=self.mhost_name,
                                                      database=self.mdb_name,
                                                      user=self.mdb_user_name,
                                                      password=self.mdb_user_pwd,
                                                      port=self.mdb_port_no, connection_timeout=180)
            if connection1.is_connected():
                db_Info = connection1.get_server_info()
                logger.info("Connected to MySQL Server version : {}".format(db_Info))
                cursor = connection1.cursor()
                cursor.execute("select database();")
                record = cursor.fetchone()
                logger.info("You're connected to master database: {}".format(record[0]))
                cursor = connection1.cursor(dictionary=True)
                sql_select_query = '''SELECT  tenant_host_name, tenant_db_name, tenant_db_user_name, tenant_db_user_pwd,  sqs_throttling_error, sqs_concurrency_handling FROM tbl_Tenant_AWS_Configuration
                                        where tenant_bucket_name=%s'''
                cursor.execute(sql_select_query,  (self.bucket_name,))
                record = cursor.fetchone()
                self.reinvoke_queue_url = record['sqs_concurrency_handling']
                self.queue_url = record['sqs_throttling_error']
                self.host_name = record['tenant_host_name']
                self.db_name = record['tenant_db_name']
                self.db_user_name = record['tenant_db_user_name']
                self.db_user_pwd = record['tenant_db_user_pwd']
                connection1.close()
                cipher_text = base64.b64decode(self.db_user_pwd)
                key = self.key.encode('utf-8')
                iv = self.iv.encode('utf-8')
                aes = AES.new(key, AES.MODE_CBC, iv)
                plaintext = aes.decrypt(cipher_text)
                # Remove PKCS7 padding
                pad = plaintext[-1]
                plaintext = plaintext[:-pad]
                self.db_user_pwd = plaintext.decode('utf-8')

                # extracted_data = asyncio.run(self.analyze_pdf(doc, extraction_type_list))
                self.build_context()
                status=self.main()
                if status ==1:
                    connection = mysql.connector.connect(host=self.host_name,
                                             database=self.db_name,
                                             user=self.db_user_name,
                                             password=self.db_user_pwd,
                                             port=self.db_port_no,connection_timeout=180)
                    if connection.is_connected():
                        db_Info = connection.get_server_info()
                        logger.info("Connected to MySQL Server version: {} ".format(db_Info))
                        cursor = connection.cursor()
                        
                        self.insert_split() 
                        # print("last chunk found, invoking update extraction")
                        
                        sql_chunk='''select Page_count from tbl_Case_UploadedFiles where File_Id=%s'''
                        cursor.execute(sql_chunk, (self.file_id,))
                        total_pages = int(cursor.fetchone()[0]) 
                        
                        chunksno = 30*(total_pages//299)
                        if (total_pages%299)%10 == 0:
                            chunksno = chunksno + (total_pages%299)//10
                        else:
                            chunksno = chunksno + (total_pages%299)//10 +1
                        chunksno = chunksno*10
                        
                        sql_select_query_completed = '''SELECT count(Status) as status_count FROM tblTemplate_AI_Extraction
                        where File_Id=%s and Status=3'''
                        
                        cursor.execute(sql_select_query_completed, (self.file_id,))
                        record_rows = int(cursor.fetchone()[0])
                        
                        if record_rows == chunksno:
                            logger.info(" all pages are done")
                        #     invoking = lambda_client.invoke(
                        #         FunctionName=str(self.update_status_arn),
                        #         InvocationType='Event',
                        #         Payload=json.dumps({"case_id": self.case_id, "file_id":self.file_id, "retry":0, "bucket_name": self.bucket_name, "template_id": self.template_id})
                        #         )
                        else:
                            logger.info("Rows Added with status 3:{}, Total chunks:{} ".format(record_rows,chunksno))

        finally:
                logger.info("[Extract_class_init] execution complete") 

    def insert_extraction_data(self, extraction_type, data,chunk_no):
        """Insert extracted data into the MySQL database."""
        print("inside func insert_data_into_db ")
        connection = mysql.connector.connect(host=self.host_name,
                                             database=self.db_name,
                                             user=self.db_user_name,
                                             password=self.db_user_pwd,
                                             port=self.db_port_no,connection_timeout=180) 
        extract_status=2 
        lambda_name=""
        current_datetime = datetime.now()
        try:
            start = time.time()
            if connection.is_connected():
                db_Info = connection.get_server_info()
                logger.info("Connected to MySQL Server version: {} ".format(db_Info))
                cursor = connection.cursor()
                cursor.execute("SELECT DATABASE();")
                record = cursor.fetchone()
                logger.info("You're connected to database: {}".format(record[0]))
                
                
                extract_status=2    # 2 is status code for "in progress"  
                
                lambda_mapping ={"icd_code" : "Extract-ICD-Codes", "cpt_code" : "Extract-CPT-Codes", "medication" : "Extract-Medication-Data", "injuries" : "Extract-Injury-Data", "prior_injuries" : "Extract-Prior-Injury-Data", "future_treatment_summary" : "Extract-Future-Treatment-Summary", "chronological_summary" : "Extract-chronological-treatment-Summary", "diagnostic_study_summary" : "Extract-Diagnostic-Study-Summary", "case_info_summary" : "Extract-Case-Info-Summary", "pain" : "Extract-Pain-Data","mass_tort":"Extract-Mass-Tort-Data"}
                lambda_name = lambda_mapping.get(extraction_type, '')
                
                if extraction_type == "icd_code":
                    
                    print(extraction_type)
                    sql = """INSERT INTO tblTemplate_ICDCodes_dupl (File_Id, TemplateId, Description, ICD_Code, ICD_Date, PageNumber) VALUES (%s, %s, %s, %s, %s, %s) """
                    # sql  = "INSERT INTO tblTemplate_ICDCodes (File_Id, TemplateId, Description, ICD_Code, ICD_Date, PageNumber) VALUES (%s, %s, %s, %s, %s, %s) ON DUPLICATE KEY UPDATE PageNumber = IF(FIND_IN_SET(VALUES(PageNumber), PageNumber) = 0, CONCAT(PageNumber, ',', VALUES(PageNumber)), PageNumber);"""
                    print("data:",data)
                    values = [(
                           self.file_id , self.template_id, self.safe_json(record.get('ICD Code Details')), self.safe_json(record.get('ICD Code')),record.get('Date'),record.get('UAHBTDRS CODE'))
                        for record in data
                        if record.get('ICD Code') and record.get('ICD Code Details')
                        ]
                            # if record.get('ICD Code') is not None and record.get('ICD Code Details') is not None

                    print("values:",values)    
                    cursor.executemany(sql, values)
                    extract_status=3
                    print("insertion success")
                    
                   
                elif extraction_type == "cpt_code":
                    
                    sql = """INSERT INTO tblTemplate_CPTCodes_dupl(File_Id, TemplateId, Description,CPT_CODE, CPT_Date, PageNumber) VALUES ( %s, %s, %s, %s, %s, %s)"""
                    print("data:",data)
                    values = [(
                            self.file_id , self.template_id, self.safe_json(record.get('CPT Code Description')),self.safe_json(record.get('CPT Code')), record.get('Date'), record.get('UAHBTDRS CODE'))
                        for record in data
                        if record.get('CPT Code') and record.get('CPT Code Description')]
                    print("values:",values)    
                    cursor.executemany(sql, values)
                    extract_status=3
                    print("insertion success")
    
                elif extraction_type == "medication":
                    
                    sql="""INSERT INTO tblTemplate_TreatmentJournal_Medications_dupl(File_Id, TemplateId, WasTheMedicationPrescribed, MedicationNameAndDosage, PrescriptionDate, PrescribingProvider, Notes, MedicationDiagnosisCodesAndDescripition, PageNumber) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)"""
                    # sql= """INSERT INTO tblTemplate_TreatmentJournal_Medications (File_Id, TemplateId, WasTheMedicationPrescribed, MedicationNameAndDosage, PrescriptionDate, PrescribingProvider, Notes, MedicationDiagnosisCodesAndDescripition, PageNumber) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) ON DUPLICATE KEY UPDATE PageNumber = IF(FIND_IN_SET(VALUES(PageNumber), PageNumber) = 0, CONCAT(PageNumber, ',', VALUES(PageNumber)), PageNumber);"""
                    values = [(
                            self.file_id , self.template_id, self.safe_json(record.get('Was the Medication Prescribed')), self.safe_json(record.get('Medication Name and Dosage')),
                            record.get('Prescription Date'),self.safe_json(record.get('Prescription Provider')),self.safe_json(record.get('Notes')), self.safe_json(record.get('Diagnosis Codes and Description')),record.get('UAHBTDRS CODE')
                        )for record in data
                        if record.get('Medication Name and Dosage') ]
                    cursor.executemany(sql, values)
                    extract_status=3
                    print("insertion success")
    
                elif extraction_type == "future_treatment_summary":
                    
                    # sql = """Insert into tblTemplate_FutureTreatmentSummary(Case_Id, File_Id, TemplateId, CurrentTreatmentRecommendations, FutureTreatmentRecommendations, CreatedDate) Values(%s, %s,%s, %s,%s,%s)"""
                    
                    # values = [( self.case_id,self.file_id , self.template_id,self.safe_json(record.get('Current treatment')),self.safe_json(record.get('Future treatment')),current_datetime)for record in data]
                    # print(values)
                    # cursor.executemany(sql, values)
                    extract_status=3
                    print("insertion success")
               
                elif extraction_type == "chronological_summary":
                    
                    
                    sql_event_sum= """INSERT INTO tblTemplate_SummaryOfEvents_dupl (Case_Id, File_Id, EventDate, Provider, TypeofVisit, HistoryofIllness, Assessment, TreatmentRecommendation, PageRef, ValueDriver, CreatedDate, TemplateId) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""
                    values_event_sum = [(self.case_id,self.file_id, record.get('Date'), self.safe_json(record.get('Treatment Facility and Provider')), self.safe_json(record.get('Type of Document')),self.safe_json(record.get('History of Illness')), self.safe_json ((record.get('Assessment') or "")+"\n"+ (record.get('Medical Diagnosis Codes and Descriptions')or "")), self.safe_json((record.get('Treatment Recommendation')or "") + "\n" + (record.get('Treatment Provided')or "")), record.get('UAHBTDRS CODE'), self.safe_json(record.get('Value Driver')), current_datetime, self.template_id
                        )for record in data
                        if record.get('History of Illness') or record.get('Treatment Recommendation')
                        and record.get('Type of Document') 
                        and record.get('Type of Document').strip().lower() not in ['laboratory reports', 'diagnostic studies','labs','Diagnostic Radiology','Nursing assessments']
                    ]
                    # 
                    
                    print(values_event_sum)
                    cursor.executemany(sql_event_sum, values_event_sum)
                    print("1")
                    # record.get('Treatment Recommendation'))+ treatment provided

                    sql_treatment=  """INSERT INTO tblTemplate_Treatment_dupl(File_Id, TemplateId, DateOfTreatment, TypeOfVisits, TypeofTreatments, DiagnosisCodesWithDescription, FollowUpAndRecommendations, SummaryofVisitAndAbnormalFindingsImpression, TreatmentProceduresSurgeryPerformedThisVisit, ValueDriversValueKillers, PageNumber ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""
                    
                    values_treatment = [(
                            self.file_id, self.template_id,record.get('Date'), self.safe_json(record.get('Type of Document')), self.safe_json(record.get('Type of Treatments')), self.safe_json(record.get('Medical Diagnosis Codes and Descriptions')), self.safe_json(record.get('Treatment Recommendation')) ,self.safe_json(record.get('Assessment')), self.safe_json(record.get('Treatment Provided')), self.safe_json(record.get('Value Driver')),record.get('UAHBTDRS CODE')
                        )for record in data
                        ]
                        # if record.get('Date') and record.get('Type of Document') and record.get('Treatment Provided')
                    print(values_treatment)
                    cursor.executemany(sql_treatment, values_treatment)
                    extract_status=3
                    print("insertion success")

    
                elif extraction_type == "prior_injuries":
                    
                    sql =  """INSERT INTO tblTemplate_PriorInjuries_dupl (File_Id, TemplateId, OnsetDate, PreExistingInjuries, Treatment, MedicalProviderORPharmacy, PriorInjuryOrConditionDiagnosisCodes, BodyPartsAffected,  AdditionalComments, PageNumber) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s,%s)"""
    
                    values = [(
                        self.file_id , self.template_id, record.get('Date of Prior Injury'), self.safe_json(record.get('Pre-existing Injuries')), self.safe_json(record.get('Provided Treatment')), self.safe_json(record.get('Healthcare Provider/Pharmaceutical Provider')or None), self.safe_json(record.get('Pre-existing Diagnosis Code')), self.safe_json(record.get('Affected Anatomical Region')), self.safe_json(record.get('Additional Notes')), record.get('UAHBTDRS CODE')
                        )for record in data
                        if record.get('Pre-existing Injuries')]
                    print("prior injuries: ",values)    
                    cursor.executemany(sql, values)
                    extract_status=3
                    print("insertion success")
    
                elif extraction_type == "diagnostic_study_summary":
                    
                    
                    sql1 = """INSERT INTO tblTemplate_DiagnosticStudyResults_dupl(Case_Id, File_Id, DiagnosticsDate, Provider, TypeofStudy, History, Findings, PageRef, CreatedDate, TemplateId) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""
                # 'Date', 'Treatment Facility and Provider','Diagnostics Study','Indication/History','Findings/Impression','Procedure/Surgeries','Recommendation','Specialty
                    
                    values_diagnostics = [(
                            self.case_id,self.file_id,record.get('Date'),self.safe_json(record.get('Treatment Facility and Provider')),self.safe_json(record.get('Diagnostics Study')),self.safe_json(record.get('Indication/History')),self.safe_json(record.get('Findings/Impression')),record.get('UAHBTDRS CODE'),current_datetime,self.template_id
                        )for record in data
                        if record.get('Findings/Impression')]
                    cursor.executemany(sql1, values_diagnostics)
                    print("1")
                    sql2 = """INSERT INTO tblTemplate_Surgeries_dupl(Case_Id, File_Id, DateOfSurgeries, Provider, History, Surgery, Recommendations, PageRef, CreatedDate, TemplateId) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""
    
                    
                    values_surgeries = [(
                            self.case_id,self.file_id, record.get('Date'), self.safe_json(record.get('Treatment Facility and Provider')), self.safe_json(record.get('Indication/History')), self.safe_json(record.get('Procedure/Surgeries')), self.safe_json(record.get('Recommendation')), record.get('UAHBTDRS CODE'), current_datetime, self.template_id)
                            for record in data
                            if record.get('Procedure/Surgeries')]
                    cursor.executemany(sql2, values_surgeries) 
                    print("2")
                    sql3 =  """INSERT INTO tblTemplate_TreatingProvider_dupl(Case_Id, File_Id, DatesofTreatment, Provider, Specialty, PageRef,  CreatedDate, TemplateId,DocumentType) VALUES (%s, %s, %s, %s, %s, %s, %s, %s,%s)"""
    
                    
                    values_treatment = [(
                        self.case_id,self.file_id, record.get('Date'), self.safe_json(record.get('Treatment Facility and Provider')), self.safe_json(record.get('Specialty')), record.get('UAHBTDRS CODE'), current_datetime, self.template_id ,self.safe_json(record.get('Type of Document')))
                        for record in data]
                    cursor.executemany(sql3,values_treatment)   
                    extract_status=3
                    print("insertion success")

                elif extraction_type == "case_info_summary":
                    
                    # pass
                    extract_status=3
                    print("insertion success")
                    
                elif extraction_type == "pain":
                    lambda_name="Extract-Pain-Data"
                    sql =  """INSERT INTO tblTemplate_Pain_dupl(File_Id, TemplateId, PainLevelReportedDate, PainLevel,Notes, PainLevelDiagnosisCodes, BodyPartsAffected, PageNumber ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"""
                    values = [(
                            self.file_id , self.template_id, record.get('Date Reported'),self.safe_json(record.get('Pain Severity Rating')),self.safe_json(record.get('Pain Descriptions')),self.safe_json(record.get('Medical Diagnosis Codes and Descriptions')),self.safe_json(record.get('Affected Anatomical Regions')),record.get('UAHBTDRS CODE')
                        )for record in data]
                    print("values:",values)
                    cursor.executemany(sql, values)
                    extract_status=3
                    print("insertion success")
    
                elif extraction_type == "injuries":
                    

                    sql =  """INSERT INTO tblTemplate_Injuries_dupl(File_Id,TemplateId,OnSetDateOfInjury, TypeofInjury, BodyPartsInjured, DiagnosisCodesWithDescription, OverallImpairmentStatus,DateOfDiagnosis,DiagnosingDoctorProvider,Comments, DiagnosisFindings, PreExistingMedicalCondition, FamilyHistory, PageNumber ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s,%s, %s, %s, %s,%s, %s)"""
                    values = [(
                            self.file_id , self.template_id, record.get('Date of Injury'), self.safe_json(record.get('Injuries Details')), self.safe_json(record.get('Affected Anatomical Region')), self.safe_json(record.get('Medical Diagnosis Codes and Descriptions')), self.safe_json(record.get('Complete Incapacitation Assessment')), record.get('Date of Medical Diagnosis'), self.safe_json(record.get('Healthcare Provider/Pharmaceutical Provider')), self.safe_json(record.get('Additional Notes')), self.safe_json(record.get('Diagnosis Findings')), self.safe_json(record.get('Pre-Existing Medical Conditions')), self.safe_json(record.get('Family History')), record.get('UAHBTDRS CODE')
                        )for record in data]
                    cursor.executemany(sql, values) 
                    extract_status=3
                    print("insertion success")
                    
                
                elif extraction_type == "mass_tort":
                 

                    sql = """
                        INSERT INTO tblTemplate_MassTort ( File_Id, TemplateId, date_first_documented, duration_of_usage, date_symptoms_reported, date_diagnosed, diagnosed_age ) 
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                        """
                       
                    values = [
                            (
                                self.file_id, self.template_id, record.get('Date of Documented initial product usage'), record.get('Duration of Medication/Device Use/Exposure'), record.get('Symptoms Reported Date'), record.get('Confirmed Diagnosis Date'), record.get('Diagnosed age')
                            ) 
                            for record in data
                        ]
                    cursor.executemany(sql, values)
 
                    extract_status=3
                    print("insertion success")
                    
                print("extraction type inserted was:",extraction_type)
                connection.commit()

            
        except Exception as e:
            extract_status=2
            print("Error occurred")
            logger.error("Error occurred: {}".format(e))
            
        finally:
            if connection.is_connected():
                
                sql_update_query = """UPDATE tblTemplate_AI_Extraction SET Status = %s,Execution_Time = GREATEST(0, TIMESTAMPDIFF(SECOND, AIExtraction_Date, UTC_TIMESTAMP(6)) + 
                                 (MICROSECOND(UTC_TIMESTAMP(6)) - MICROSECOND(AIExtraction_Date)) / 1000000) WHERE File_Id= %s AND Chunk_No=%s AND LambdaName=%s """
    
                cursor.execute(sql_update_query, (extract_status,self.file_id,chunk_no,lambda_name))
                print("Status being updated as: ",extract_status)
                connection.commit()
                print("Status successfully updated as: ",extract_status)
                connection.close()
                logger.info("MySQL connection closed.")
            return 
        
    async def analyze_pdf(self,doc, extraction_type_list):
        print("inside func analyze pdf ")
        extracted_data = {}
        chunk_size = 10
        no_of_pages = doc.page_count  # Use the actual number of pages
        pages_processed = 0
        lambda_mapping ={"icd_code" : "Extract-ICD-Codes", "cpt_code" : "Extract-CPT-Codes", "medication" : "Extract-Medication-Data", "injuries" : "Extract-Injury-Data", "prior_injuries" : "Extract-Prior-Injury-Data", "future_treatment_summary" : "Extract-Future-Treatment-Summary", "chronological_summary" : "Extract-chronological-treatment-Summary", "diagnostic_study_summary" : "Extract-Diagnostic-Study-Summary", "case_info_summary" : "Extract-Case-Info-Summary", "pain" : "Extract-Pain-Data","mass_tort":"Extract-Mass-Tort-Data"}


        for extraction_type in extraction_type_list:
            start_page=0
            pages_processed=0

            lambda_name = lambda_mapping.get(extraction_type, '')
            print("extracting now for: ", extraction_type)
            data_for_type = []
            tasks = []
            
            for i in range(0, no_of_pages, chunk_size): 
                if pages_processed >= MAX_PAGES_INVOKES:
                    answers = await asyncio.gather(*tasks)
                    print("answers:", answers)
                    for answer in answers:
                        try:
                            # print("data1: ", answer)
                            data = self.post_processing(answer)
                            data_for_type += data
                        except Exception as e:
                            print(e)
                    pages_processed = 0
                    tasks = []
                start_page=pages_processed+1
                pages_processed += chunk_size
                ocr_text = self.extract_text_from_pdf(doc, i, min(i + chunk_size, no_of_pages))
                response = self.invoke_model_llm(ocr_text,start_page,pages_processed,lambda_name,extraction_type,self.chunk_no)
                tasks.append(response)

            answers = await asyncio.gather(*tasks)
            # print("answers after wait: ",answers)
            for answer in answers:
                try:
                    print("data2: ", answer)
                    data = self.post_processing(answer)
                    data_for_type += data
                except Exception as e:
                    print(e)
                    
            # print("data3 before: ", data_for_type)
            # json_data = json.dumps(data_for_type)
            # Insert extracted data into the database
            # print("data3 after: ", data_for_type
            
            # self.insert_summary(response_text,)
            # if (lambda_name =="Extract-Future-Treatment-Summary" or lambda_name =="Extract-Case-Info-Summary"):
            #     summary_data=data_for_type
            # else:
            #     summary_data=" "
            # status=self.first_insertion(start_page,pages_processed,lambda_name,summary_data)
            print("before date processing: ",data_for_type)
            data_corrected_date = self.standardize_dates(data_for_type) # unused
            print("data_corrected_date:",data_corrected_date)
            
            cleaned =self.clean_data(data_for_type)
            print("after data processing: ",cleaned)
            # to change
            self.insert_extraction_data(extraction_type, cleaned,self.chunk_no)
            
            

            extracted_data[extraction_type] = data_for_type
        return extracted_data # return status later        


    def main(self):
        print("inside main")
        try:
                start = time.time()

                bucket_name = self.bucket_name
                s3_prefix = self.s3_prefix

                # S3 client
                s3_client = boto3.client('s3')

                # Get the PDF file from S3
                file = s3_client.get_object(Bucket=bucket_name, Key=s3_prefix)
                pdf_content = file['Body'].read()

                # Open the PDF using fitz
                pdf_document = pymupdf.open(stream=pdf_content, filetype='pdf')

                # Get the number of pages
                num_pages = pdf_document.page_count
                print(f"Total number of pages in PDF: {num_pages}")
                
                if self.template_id ==1:    
                    print(" PERSONAL INJURY TEMPLATE CHOSEN")
                    extraction_type_list = ["cpt_code", "medication", "future_treatment_summary", "icd_code", "chronological_summary", "prior_injuries", "diagnostic_study_summary","case_info_summary", "pain", "injuries"]
                elif self.template_id ==2:   
                    print(" MASS TORT TEMPLATE CHOSEN")
                    extraction_type_list = ["mass_tort","cpt_code", "medication", "icd_code", "chronological_summary", "diagnostic_study_summary","case_info_summary", "pain"]
                    # extraction_type_list = ["case_info_summary"]

                else:
                    raise ValueError("Template id incorrect")
                
                # extraction_type_list = ["cpt_code", "medication", "future_treatment_summary", "icd_code", "chronological_summary", "prior_injuries", "diagnostic_study_summary","case_info_summary", "pain", "injuries"]

                
            # Run the async analysis
                extracted_data = asyncio.run(self.analyze_pdf(pdf_document, extraction_type_list))
        
                return 1
        finally:
            print("done")    


    def extract_text_from_pdf(self,doc, start_page, end_page):
        """Extracts text from a range of pages in a PDF file."""
        text = ""
        for page_num in range(start_page, end_page):
            page = doc.load_page(page_num)
            # ( chunk no - 1 )* 299 )+ page number
            text += ("\n<page>\n" + "UAHBTDRS_CODE:" + str ((( self.chunk_no - 1 )* 299 ) + page_num + 1) + "\n" + page.get_text() + "\n</page>\n")
            # print("page number:",text)
        return text
        
    def first_insertion(self,start_page,pages_processed,lambda_name,summary_data,chunk_no):
        
        """Insert extracted data into the MySQL database."""
        print("inside func first_insertion ")
        connection = mysql.connector.connect(host=self.host_name,
                                             database=self.db_name,
                                             user=self.db_user_name,
                                             password=self.db_user_pwd,
                                             port=self.db_port_no,connection_timeout=180) 
        try:
            start = time.time()
            if connection.is_connected():
                db_Info = connection.get_server_info()
                logger.info("Connected to MySQL Server version: {} ".format(db_Info))
                cursor = connection.cursor()
                cursor.execute("SELECT DATABASE();")
                record = cursor.fetchone()
                logger.info("You're connected to database: {}".format(record[0]))
                
            json_data = json.dumps(summary_data)

            
            sql_insert_query = ("""Insert into tblTemplate_AI_Extraction(File_Id,LambdaName,SplitFilePath, Start_Index, End_Index, Chunk_No, Status, AIExtraction_Date, AWSAccount,Summary )
            Values(%s, %s,%s, %s,%s,%s, %s, %s, %s,%s)""")
            
            insert_db = (
                        self.file_id, lambda_name, self.bucket_name + '/' + self.s3_prefix, start_page, pages_processed, int(chunk_no),2,datetime.utcnow(), self.account_id,json_data
                    )
            print(insert_db)        
            cursor.execute(sql_insert_query, insert_db)
            connection.commit()
            connection.close()
            
            return True #later return some status
        except Exception as e:
                print("error in first_insertion")
                logger.error("Error occurred: {}".format(e))
                
    # unused
    def standardize_dates(self,records):
        # Define potential date field names
    
    #     date_fields = [
    #     'Date', 'Prescribed Date', 'Date Reported', 'Prescription Date', 'Confirmed Diagnosis Date', 'Symptoms Reported Date', 'Confirmed Diagnosis Date',
    #     'Date of Prior Injury', 'Injury Date', 'Date of Medical Diagnosis', 'Date of Birth of the Patient', 'Date of Injury','Date of Documented initial product usage',  'Symptoms Reported Date','Confirmed Diagnosis Date'
    # ]
        date_fields = [
            'Date', 'Prescribed Date', 'Date Reported', 'Prescription Date', 
            'Confirmed Diagnosis Date', 'Symptoms Reported Date', 'Date of Prior Injury', 'Injury Date', 'Date of Medical Diagnosis', 
            'Date of Birth of the Patient', 'Date of Injury', 'Date of Documented initial product usage'
        ]
    
                        
        for record in records:
            for field in date_fields:
                if field in record and record[field]:  # Check if field exists and is not None
                    date_str = str(record[field]).strip()  # Convert to string and strip whitespace
                
                # List of potential date formats
                    date_formats = [
                    "%m/%d/%Y",   # MM/DD/YYYY
                    "%m/%d/%y",   # MM/DD/YY
                ]
                
                # Attempt to parse the date string 
                    parsed = False
                    for fmt in date_formats:
                        try:
                            record[field] = datetime.strptime(date_str, fmt).strftime("%Y-%m-%d 00:00:00.000000")
                            parsed = True
                            break  # Exit loop if parsing is successful
                        except ValueError:
                            continue  # Try next format

                    if not parsed:
                        print(f"Unknown date format: {date_str}")  
                        record[field] = None
                        

        return records 
        
        

    def standardize_dates1(self, records):
        # Define potential date field names
        date_fields = [
            'Date', 'Prescribed Date', 'Date Reported', 'Prescription Date', 
            'Confirmed Diagnosis Date', 'Symptoms Reported Date', 'Date of Prior Injury', 'Injury Date', 'Date of Medical Diagnosis', 
            'Date of Birth of the Patient', 'Date of Injury', 'Date of Documented initial product usage'
        ]
        
        for record in records:
            for field in date_fields:
                if field in record and record[field]:  # Check if field exists and is not None
                    date_str = str(record[field]).strip()  # Convert to string and strip whitespace
                    
                    # List of potential date formats
                    date_formats = [
                        "%m/%d/%Y",   # MM/DD/YYYY
                        "%m/%d/%y",   # MM/DD/YY
                    ]
                    
                    # Attempt to parse the date string
                    parsed = False
                    for fmt in date_formats:
                        try:
                            record[field] = datetime.strptime(date_str, fmt).strftime("%Y-%m-%d 00:00:00.000000")
                            parsed = True
                            break  # Exit loop if parsing is successful
                        except ValueError:
                            continue  # Try next format
                    
                    # Handle dates containing only a year
                    if not parsed:
                        if date_str.isdigit() and len(date_str) == 4:  # Check if it's a 4-digit year
                            record[field] = f"{date_str}-00-00 00:00:00.000000"
                            parsed = True
    
                    if not parsed:  # If still not parsed, log or handle unknown format
                        print(f"Unknown date format: {date_str}")
                        record[field] = None
    
        return records
        
        
        
            
    def insert_summary(self,text,start,pages_processed,lambda_name):
        
        """Insert extracted data into the MySQL database."""
        print("inside func insert_summary ")
        connection = mysql.connector.connect(host=self.host_name,
                                             database=self.db_name,
                                             user=self.db_user_name,
                                             password=self.db_user_pwd,
                                             port=self.db_port_no,connection_timeout=180) 
        try:
            start = time.time()
            if connection.is_connected():
                db_Info = connection.get_server_info()
                logger.info("Connected to MySQL Server version: {} ".format(db_Info))
                cursor = connection.cursor()
                cursor.execute("SELECT DATABASE();")
                record = cursor.fetchone()
                logger.info("You're connected to database: {}".format(record[0]))
        # ,Execution_Time=%s
                connection.commit()
        except Exception as e:
            print("error in insert_summary")
            logger.error("Error occurred: {}".format(e))
            
        finally:
            print()
            
    def insert_split(self):
        
        """Insert extracted data into the MySQL database."""
        print("inside func insert_summary ")
        connection = mysql.connector.connect(host=self.host_name,
                                             database=self.db_name,
                                             user=self.db_user_name,
                                             password=self.db_user_pwd,
                                             port=self.db_port_no,connection_timeout=180) 
        try:
            start = time.time()
            if connection.is_connected():
                db_Info = connection.get_server_info()
                logger.info("Connected to MySQL Server version: {} ".format(db_Info))
                cursor = connection.cursor()
                cursor.execute("SELECT DATABASE();")
                record = cursor.fetchone()
                logger.info("You're connected to database: {}".format(record[0]))   
                
                sql_update_query = ("""
                    UPDATE tblTemplate_AI_Extraction_File_Split
                    SET Chunk_No = %s
                    WHERE Split_File_Name = %s and File_Id = %s
                        """)
                filename = self.s3_prefix.split("/")[-1]
                cursor.execute(sql_update_query, (self.chunk_no, filename, self.file_id ))
                connection.commit()
                
        except Exception as e:
            print("error in insert_summary")
            logger.error("Error occurred: {}".format(e))        
            

    async def invoke_model_llm(self,ocr_text,start_page,end_page,lambda_name,extraction_type,chunk_no):
        """Asynchronously invokes the AI model with the given text and extraction type."""
        print("inside func invoke_model_llm")
        
        system_msg = get_system_prompt(extraction_type,self.template_id,self.context_string)
        messages = get_message_list(extraction_type,self.template_id)

        updated_messages = []
        for message in messages:
            message_copy = {
                "role": message["role"],
                "content": []
            }
            for part in message["content"]:
                part_copy = {"type": part["type"], "text": part["text"]}
                if "<ocr_text_placeholder>" in part_copy["text"]:
                    part_copy["text"] = part_copy["text"].replace("<ocr_text_placeholder>", ocr_text)
                message_copy["content"].append(part_copy)
            updated_messages.append(message_copy)

        request_body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": MAX_TOKENS,
            "system": system_msg,
            "messages": updated_messages,
            "temperature": 0,
            "top_k": 50,
            "top_p": 1,
        }

        try:
            MODEL_ID = "anthropic.claude-3-haiku-20240307-v1:0"
            # print("model id:",MODEL_ID)
            # response = client.invoke_model( modelId=MODEL_ID, body=json.dumps(request_body))
            response = await asyncio.to_thread(client.invoke_model,
                                           modelId=MODEL_ID,
                                           body=json.dumps(request_body))
            result = json.loads(response.get("body").read())
            # print("response from anthropic:",result)
            clean_result= result.get("content", [])
            
            self.first_insertion(start_page,end_page,lambda_name,clean_result,chunk_no)
            
            # print("cleaned response ",clean_result)
            return clean_result
            
        except ClientError as err:
            print(f"Couldn't invoke Claude 3 Haiku Vision for {extraction_type}. Error: {err.response['Error']['Code']}: {err.response['Error']['Message']}")
            raise
        
    def post_processing(self,answer):
        print("inside post processing")
        text_output = answer[0]['text']
        start_index = text_output.find("[")
        end_index = text_output.rfind("]") + 1
        json_str = text_output[start_index:end_index]
        data = json.loads(json_str)
        return data    
        
    def clean_data(self,entries):
    # Define values that should be replaced with None
        placeholders = {"none mentioned", "N/A", "n/a", "None mentioned", "NaN","na","NA","Not provided","None","None reported","No data","None Listed", "not available","Not Provided","Not Applicable"}

        
        for entry in entries:
            if isinstance(entry, dict):  # Check if entry is a dictionary
                for key in entry:
                    # Ensure the value is a string before checking
                    if isinstance(entry[key], str) and entry[key] in placeholders:
                        entry[key] = None
        return entries
        
    def safe_json(self,value):
   # """Convert a value to JSON, returning None if the value is None."""
        # return json.dumps(value) if value is not None else None    
        if value is None:
            return None  # SQL-friendly NULL
        elif isinstance(value, (list, dict)):
            return json.dumps(value)  # Serialize list/dict to JSON
        else:
            return value

    def build_context(self):

        conn = mysql.connector.connect(host=self.host_name,
                                             database=self.db_name,
                                             user=self.db_user_name,
                                             password=self.db_user_pwd,
                                             port=self.db_port_no,connection_timeout=180)
        cursor = conn.cursor()

        try:

            query="select t2.option_name,t1.qAndA,t1.CaseSummary from tbl_CaseDetails t1 join tbl_Case_TypeOptions t2 on t2.option_id=t1.caseTypeOptions where case_id=%s"

            cursor.execute(query, (self.case_id,))
            masstort_type=""
            

            # Fetch and print results
            result = cursor.fetchone()
            if result:
                    print(f"Option Name: {result[0]}, Q&A: {result[1]}.summary:{result[2]}")
                    masstort_type=result[0]

                    answers_json = json.loads(result[1]) if result[1] is not None else {}

            else:
                print("No data found for the given case ID.")


            context_string1= "Type of Mass Tort: "+ masstort_type
            self.context_string=context_string1
            case_summary=""
            if result[2]:
                case_summary="Here is a short summary about the case: " + str(result[2])


            # Step 1: Extract question IDs
            question_ids = list({entry["questionId"] for entry in answers_json if "questionId" in entry})

            # Step 3: Execute the query
            format_strings = ','.join(['%s'] * len(question_ids))
            query = f"SELECT id, label FROM tbl_Case_TypeOptionQuestions WHERE id IN ({format_strings})"
            cursor.execute(query, tuple(question_ids))

            # Step 4: Build question ID to label mapping
            questions_map = {row[0]: row[1] for row in cursor.fetchall()}

            # Step 5: Format the output list
            output_lines = []

            for entry in answers_json:
                qid = entry.get("questionId")
                question_label = questions_map.get(qid, f"Question {qid}")

                line_parts = []

                for key, value in entry.items():
                    if value is None or key == "questionId":
                        continue
                    if key == "answer":
                        line_parts.append(f"{question_label}: {value}")
                    else:
                        line_parts.append(f"{key}: {value}")

                if line_parts:
                    output_lines.append(". ".join(line_parts))
            final_string = "\n".join(output_lines)
            print(final_string)

            # Done: You now have a formatted list of strings
            
            # self.context_string+=output_lines
            self.context_string += "\n" + "\n".join(output_lines)
            self.context_string += "\n\n"+case_summary

            print("context_string: ",self.context_string)

            # Clean up
            cursor.close()
            conn.close()

        except Exception as e:
            
            print("Error occurred in build context")
            logger.error("Error occurred: {}".format(e))


def lambda_handler(event, context):
    if event:
            start_time = datetime.now()
            logger.info("Start Time: %s", start_time.strftime("%Y-%m-%d %H:%M:%S.%f"))
            logger.info("Event  : %s",event)
            Extract_Summary(event, context)
            
            logger.info("Event  : %s",event)
            end_time = datetime.now()
            logger.info("End Time: %s", end_time.strftime("%Y-%m-%d %H:%M:%S.%f"))
            
            # Calculate the time difference
            time_difference = end_time - start_time
            logger.info("Processing time : %s", time_difference)