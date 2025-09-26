icd_code_message = [
    {
        "role": "user",
        "content": [
            {
                "type": "text",
                "text": "You are provided output format which is a list of json object with required keys which is important from an legal perspective. You have to capture all the instance json object with following keys, 'Date' (Relevant date associated with the ICD Codes.), 'ICD Code' (The International Classification of Diseases (ICD),  They are alpha numeric codes related to the medical conditions, diagnoses, or treatments.), 'ICD Code Details' (Detailed descriptions corresponding to the ICD code), 'UAHBTDRS CODE' (Extract the UAHBTDRS_CODE, which appears on the same page as the above extracted relevant ICD Code information) . Here is the document text:",
            },
            {
                "type": "text",
                "text": "<ocr_text_placeholder>"
            },
            {
                "type": "text",
                "text": """<instruction> Output should be list of JSON object with keys, 'Date', 'ICD Code', 'ICD Code Details', 'UAHBTDRS CODE'. </instruction>
                        <instruction> Strictly conform to following data type for values, 'Date' : (MM/DD/YYYY), 'ICD Code' : (string ), 'ICD Code Details' : (string), 'UAHBTDRS CODE' : (integer) </instruction>
                        <instruction> Do not assume or generate information, Document only relevant information to ICD Codes</instruction> 
                        <instruction> If Information is unavailable, follow the format and document the value as "not available" </instruction> 
                        <instruction> The Dates usually are present in "MM/DD/YYYY" format in the document, if thats not the case then convert it into "MM/DD/YYYY" format. </instruction>"""
            },

        ],
    }
]

medication_message = [
    {
        "role": "user",
        "content": [
            {
                "type": "text",
                "text": "You are provided output format which is a list of json object with required keys which is important from an legal perspective. You have to capture all the instance json object with following keys,'Prescription Date' (Date of Prescribed medication) , 'Medication Name and Dosage' (Name and dosage of medication prescribed on the date identified. Do not include the medications listed under â€œcurrent medicationsâ€ or â€œmedications currently takingâ€), 'Was the Medication Prescribed' (was the medication prescribed) ,'Prescription Provider' (Name of provider who prescribed the medicines ) ,'Notes' (any additional notes) ,'Diagnosis Codes and Description'(diagnosis code and description of prescribed medicine),'UAHBTDRS CODE' (Extract the UAHBTDRS_CODE, which appears on the same page as the above extracted relevant medication information) .  "

            },
            {
                "type": "text",
                "text": "<ocr_text_placeholder>"
            },
            {
                "type": "text",
                "text": """<instruction> Output should be list of JSON object with keys, 'Prescription Date', 'Medication Name and Dosage', 'Was the Medication Prescribed' ,'Prescription Provider' ,'Notes' ,'Diagnosis Codes and Description'  'UAHBTDRS CODE'. </instruction>
                        <instruction> Strictly conform to following data type for values, 'Prescription Date' : (MM/DD/YYYY), 'Medication Name and Dosage' : (string ), 'Was the Medication Prescribed' : (boolean),'Prescription Provider': (string) ,'Notes': (string),'Diagnosis Codes and Description': (string),
                        UAHBTDRS CODE' : (integer) </instruction>
                        <instruction> If Information is unavailable, follow the format and document the value as "not available" </instruction> """
                        
            },

        ],
    }
]

cpt_code_message = [
    {
        "role": "user",
        "content": [
            {
                "type": "text",
                "text": "You are provided output format which is a list of json object with required keys which is important from an legal perspective. You have to capture all the instance json object with following keys,'Date' (Relevant date associated with the CPT Codes),'CPT Code' (Current Procedural Terminology- a uniform 5 digit numeric code used by healthcare professionals to report medical services such as surgeries, tests, evaluations or procedures)  , 'CPT Code Description' (Detailed descriptions corresponding to the CPT code), 'UAHBTDRS CODE' (Extract the UAHBTDRS_CODE, which appears on the same page as the above extracted CPT Code information) . Here is the document text:",
            },
            {
                "type": "text",
                "text": "<ocr_text_placeholder>"
            },
            {
                "type": "text",
                "text": """<instruction> Output should be list of JSON object with keys, 'Date', 'CPT Code', 'CPT Code Description', 'UAHBTDRS CODE'. </instruction>
                        <instruction> Strictly conform to following data type for values, 'Date' : (MM/DD/YYYY), 'CPT Code' : (string), 'CPT Code Description' : (string), 'UAHBTDRS CODE' : (integer) </instruction>
                        <instruction> Do not assume or generate information, Document only relevant information to CPT Codes </instruction>
                        <instruction> If Information is unavailable, follow the format and document the value as "not available" </instruction> 
                        <instruction> The Dates usually are in (MM/DD/YYYY) or (MM/DD/YY) format in the document.</instruction>"""
            },

        ],
    }
]


pain_message = [
    {
        "role": "user",
        "content": [
            {
            "type": "text",
            "text": "You are provided output format which is a list of JSON objects with required keys which is important from a legal perspective. You have to capture all the instances of JSON objects with the following keys: 'Date Reported'(Date on which the pain was reported. The Dates are present in (MM/DD/YYYY) or (MM/DD/YY) format, Document as it is ),'Pain Severity Rating' (Pain severity rating on a scale of 1-10 for each anatomical body part as mentioned ),'Pain Descriptions' (Descriptions or Details regarding the severity, frequency, and nature of the pain for each anatomical body part as mentioned),'Medical Diagnosis Codes and Descriptions' (Medical Diagnosis Codes (e.g., ICD-10 codes) related to the reported pain and the affected anatomical body part. Include both the codes and their descriptions if mentioned),'Affected Anatomical Regions' (Anatomical regions or body parts mentioned as affected by the reported pain ), 'UAHBTDRS CODE' (Extract the UAHBTDRS_CODE, which appears on the same page as the above extracted relevant pain information). Here is the document text:"
            },
            {
            "type": "text",
            "text": "<ocr_text_placeholder>"
            },
            {
            "type": "text",
            "text": """<instruction> Output should be a list of JSON objects with keys,'Date Reported' ,'Pain Descriptions', 'Pain Severity Rating', 'Medical Diagnosis Codes and Descriptions', 'Affected Anatomical Regions' , 'UAHBTDRS CODE'. </instruction>
            <instruction> Strictly conform to the following data types for values: 'Date Reported' : (MM/DD/YYYY), 'Pain Descriptions' : (string ), 'Pain Severity Rating' : (integer), 'Medical Diagnosis Codes and Descriptions' : (string), 'Affected Anatomical Regions' : (string), 'UAHBTDRS CODE' : (integer) </instruction>
            <instruction> If certain Information is unavailable, Strictly follow the format above and document the value as "not available" </instruction> """
            }
        ]
}]

prior_injuries_message = [
    {
        "role": "user",
        "content": [
            {
                "type": "text",
                "text": """You are provided output format which is a list of json object with required keys which is important from an legal perspective. You have to capture all the instance json object with following keys,'Date of claimed Injury' (The date when the injury occurred. Look for dates near terms like "injury date". The Dates are present in (MM/DD/YYYY) or (MM/DD/YY) format, Document as it is ), 'Date of Prior Injury' (The date of an injury that existed before the 'claimed injury', it is strictly the date before the date of claimed injury. The Date is present in document is present in MM/DD/YYYY format), 'Pre-existing Injuries' (Any injuries existing before the claimed injury ), 'Provided Treatment' (Details of the treatment provided for specific prior injury),'Healthcare Provider/Pharmaceutical Provider' (The name of the healthcare provider or pharmaceutical provider involved in the prior injury treatment ), 'Pre-existing Diagnosis Code' (Diagnosis codes for prior injury. Include both code and description) ,'Affected Anatomical Region' (Anatomical regions affected by the prior injury), 'Additional Notes' (Any additional relevant notes), 'UAHBTDRS CODE' (Extract the UAHBTDRS_CODE, which appears on the same page as the above extracted relevant prior-injuries' data) . Here is the document text:""",
            },
            {
                "type": "text",
                "text": "<ocr_text_placeholder>"
            },
            {
                "type": "text",
                "text": """<instruction> Output should be list of JSON object with keys, 'Date of Claimed Injury', 'Date of Prior Injury', 'Pre-existing Injuries', 'Provided Treatment', 'Healthcare Provider/Pharmaceutical Provider','Pre-existing Diagnosis Code','Affected Anatomical Region',Additional Notes','UAHBTDRS CODE'. </instruction>
                        <instruction>Only include entries where the 'Date of Prior Injury' is strictly before the 'Date of Claimed Injury'. If this condition is not met, do not include the entry.</instruction>
                        <instruction> Strictly conform to following data type for values,'Date of Claimed Injury': (MM/DD/YYYY), 'Date of Prior Injury' : (MM/DD/YYYY), 'Pre-existing Injuries' : (string), 'Provided Treatment' : (string),'Healthcare Provider/Pharmaceutical Provider': (string), 
                        'Provided Treatment' : (string),'Provided Treatment' : (string)', 'Pre-existing Diagnosis Code : (string)', 'Affected Anatomical Region' : (string), 'Additional Notes' : (string),'UAHBTDRS CODE' : (integer) </instruction>
                        <instruction> The Dates usually are present in "MM/DD/YYYY" format in the document, if thats not the case then convert it into "MM/DD/YYYY" format. </instruction>
                        <instruction> If certain Information is unavailable, Strictly follow the format above and document the value as "not available" </instruction> """
                        
            },

        ],
    }
] 

injuries_message  = [
    {
        "role": "user",
        "content": [
            {
                "type": "text",
                "text": """You are provided output format which is a list of json object with required keys which is important from an legal perspective. You have to capture all the instance json object with following keys, 'Date of Injury' (The date when the injury occurred. Look for dates near terms like "injury date", "accident date", or "incident date". The Dates are present in (MM/DD/YYYY) or (MM/DD/YY) format, Document as it is ), 'Injuries Details' (descriptions of how the injury occurred and what caused it), 'Affected Anatomical Region' (Anatomical regions affected by the  injury), 'Diagnosis Findings': (Summarize the findings from any diagnostic tests, medical examinations, or evaluations),'Healthcare Provider/Pharmaceutical Provider' (The name of the healthcare provider or pharmaceutical provider involved in the injury treatment ), 'Date of Medical Diagnosis': (the date when the diagnosis was made or documented. The Date is present in document is present in MM/DD/YYYY format),'Complete Incapacitation Assessment' : ( any statements regarding the patient's ability to work or perform daily activities fully ),' Diagnosis Code' (Diagnosis codes for injury. Include both code and description) , 'Additional Notes' (Any additional relevant notes), 'Pre-Existing Medical Conditions' (A list or description of any pre-existing medical conditions mentioned),'Family History (Relevant family medical history details),'UAHBTDRS CODE' (Extract the UAHBTDRS_CODE, which appears on the same page as the above extracted relevant injuries' data ) . Here is the document text:""",
            },
            {
                "type": "text",
                "text": "<ocr_text_placeholder>"
            },
            {
                "type": "text",
                "text": """<instruction> Output should be list of JSON object with keys, 'Date of Injury', 'Injuries Details', 'Diagnosis Findings', 'Date of Medical Diagnosis', 'Complete Incapacitation Assessment', 'Affected Anatomical Region','Healthcare Provider/Pharmaceutical Provider','Medical Diagnosis Codes and Descriptions','Additional Notes','Pre-Existing Medical Conditions','Family History','UAHBTDRS CODE'. </instruction>
                        <instruction> Strictly conform to following data type for values, 'Date of Injury' : (MM/DD/YYYY), 'Date of Medical Diagnosis':(MM/DD/YYYY) ,' Injuries Details' : (string), 'Complete Incapacitation Assessment' : (string),'Healthcare Provider/Pharmaceutical Provider': (string), 'Pre-Existing Medical Conditions': (string),'Family History': (string),
                        'Diagnosis Findings' : (string), 'Medical Diagnosis Codes and Descriptions' : (string)', 'Affected Anatomical Region' : (string), 'Additional Notes' : (string),'Pre-Existing Medical Conditions': (string),'Family History: (string),'UAHBTDRS CODE' : (integer) </instruction>
                         <instruction> If certain Information is unavailable, Strictly follow the format above and document the value as "not available" </instruction> """
            },

        ],
    }
]
 



chronological_summary_message = [
    {
        "role": "user",
        "content": [
            {
                "type": "text", 
                "text": """You are provided output format which is a list of json object with required keys which is important from an legal perspective. You have to capture all the instance json object with following keys, 'Date' (Date of treatment or date of visit. The Dates are present in document is present in MM/DD/YYYY format), 'Type of Treatments' (Specify the speciality of treatment, e.g Orthopedics, Neurology,Physical Therapy, Chiropractic Therapy, Emergency Department as mentioned in the medical records), 'Treatment Facility and Provider' (Name of the healthcare provider, including doctor's name, if available and Name of the clinic/hospital, if available ), 'Type of Document' (Identify the single most accurate type of medical document based on the content and context of the visit, by choosing exactly ONE from the following categories: Office Visit, Therapy Initial Evaluation, Therapy Daily Note, Outpatient Initial Evaluation Visit, Outpatient Follow up Visit, Discharge Summary, Consultation/Consults, Progress Notes, Clinical Notes, Physician Progress Notes, History & Physical (H&P), Therapy Notes, Operative Record, Significant Event Notes, Procedure Notes, Rehabilitation Notes, Diagnostic Radiology, Labs, Cardiac Imaging, Emergency Department Notes, Discharge Instructions, Team Conference Notes, Admission Coversheet/Admission Facesheet, Plan of Care, Anesthesia Documentation, Flowsheets, Patient Education/Education, Health Insurance Claim Forms, After Visit Summary, Medication Administration Record (MAR), Medication Reconciliation, Transfusion Records, Pastoral Care, Chaplain Notes, Patient Notification, Medication History, Surgical Documentation, Administrative Documents, Registration Records, Nursing Assessments, Care Plan, Medical Bills, Consent Forms and Patient Rights Records. The category must be from one of the above pre-defined category list ), 'Assessment' (Medical assessment or diagnosis based on the patient's condition),'Treatment Provided' (Document Treatments provided on the same date as 'treatment date'. Treatments include Details of any procedures like injections, interventional procedures, or surgeries performed on patient on the "treatment date" identified. Exclude any recommendations, plans, medications or future instructions for treatment), 'Treatment Recommendation' (Plans, Recommendations or instructions given on addition to the current ongoing treatment. include any medications prescribed, further recommendations for therapy or surgery and follow up care ),'Value Driver' (Identify or flag any significant injury or damage suffered by the patient which will enhance the value of a lawsuit from a medicolegal perspective ),'History of Illness'(Subjective complaints of the patient’s current health issues or complaints that led to the medical visit. Document the description of the accident or the injury, nature and quality of symptoms, severity of the symptoms, and duration of the symptoms, if available),'Medical Diagnosis Codes and Descriptions' (ICD Codes and Descriptions), 'UAHBTDRS CODE' (Extract the UAHBTDRS_CODE, which appears on top of the same page as the above extracted relevant extracted summary data) . Here is the document text:""",
            },
            {
                "type": "text",
                "text": "<ocr_text_placeholder>"
            },
            {
                "type": "text",
                "text": """<instruction> Output should be list of JSON object with keys, 'Date', ' Type of Treatments', 'Treatment Facility and Provider', 'Type of Document','History of Illness','Medical Diagnosis Codes and Descriptions',Assessment,'Treatment Provided','Value Driver','UAHBTDRS CODE'. </instruction>
                           <instruction> Strictly conform to following data type for values, 'Date' : (MM/DD/YYYY), ' Type of Treatments' : (string), 'Treatment Facility and Provider' : (string),'Type of Document': (string), 'History of Illness':(string),'Medical Diagnosis Codes and Descriptions':(string),'Value Driver' : (string), 'Assessment' : (string)', 'Treatment Provided' : (string), 'UAHBTDRS CODE' : (integer) </instruction>
                           <instruction> If certain Information is unavailable, Strictly follow the format above and document the value as "not available" </instruction> """
            },

        ],
    }
]

diagnostic_summary_message = [
    {
        "role": "user",
        "content": [
            {
                "type": "text",
                "text": """You are provided output format which is a list of json object with required keys which is important from an legal perspective. You have to capture all the instance json object with following keys, Date (Date of diagnosis. The Dates are present in (MM/DD/YYYY) or (MM/DD/YY) format, Document as it is ),'Treatment Facility and Provider'(Details of the healthcare provider,' including doctor's name and clinic/hospital,if available),' Diagnostics Study'(Name or type of the diagnostic study. Ex: CT, MRI, X-ray),' Indication/History'(Reason for which the diagnostic study is performed),' Findings/Impression'(Descriptions of findings/impressions as mentioned in the document),'Procedure/Surgeries'(name and Description of the Surgeries/procedures undergone),' Recommendation':(Descriptions of doctor recommendation for additional follow up or clinical correlation),'Specialty':(Descriptions of Specialty),'Type of Document' (Identify the single most accurate type of medical document based on the content and context of the visit, choosing exactly ONE from the following categories: Office Visit, Therapy Initial Evaluation, Therapy Daily Note, Outpatient Initial Evaluation Visit, Outpatient Follow up Visit, Discharge Summary, Consultation/Consults, Progress Notes, Clinical Notes, Physician Progress Notes, History & Physical (H&P), Therapy Notes, Operative Record, Significant Event Notes, Procedure Notes, Rehabilitation Notes, Diagnostic Radiology, Labs, Cardiac Imaging, Emergency Department Notes, Discharge Instructions, Team Conference Notes, Admission Coversheet/Admission Facesheet, Plan of Care, Anesthesia Documentation, Flowsheets, Patient Education/Education, Health Insurance Claim Forms, After Visit Summary, Medication Administration Record (MAR), Medication Reconciliation, Transfusion Records, Pastoral Care, Chaplain Notes, Patient Notification, Medication History, Surgical Documentation, Administrative Documents, Registration Records, Nursing Assessments, Care Plan, Medical Bills, Consent Forms, Patient Rights Records ),'UAHBTDRS CODE' (Extract the UAHBTDRS_CODE, which appears on the same page as the above extracted relevant diagnostic details' data). Here is the document text:""",
            },
            {
                "type": "text",
                "text": "<ocr_text_placeholder>"
            },
            {
                "type": "text",
                "text": """<instruction> Output should be list of JSON object with keys, 'Date', 'Treatment Facility and Provider','Diagnostics Study','Indication/History','Findings/Impression','Procedure/Surgeries','Recommendation','Specialty','Type of Document','UAHBTDRS CODE'. </instruction>
                        <instruction>Strictly conform to following data type for values, 'Date' : (MM/DD/YYYY), 'Treatment Facility and Provider': (string),'Diagnostics Study': (string), 'Indication/History': (string),' Findings/Impression': (string),'Procedure/Surgeries': (string),' Recommendation': (string),'Specialty': (string),'Type of Document':(string), 'UAHBTDRS CODE' : (integer) </instruction>
                        <instruction> If certain Information is unavailable, Strictly follow the format above and document the value as "not available" </instruction> """
            },

        ],
    }
]


case_info_summary_message = [
    {
        "role": "user",
        "content": [
            {
                "type": "text",
                "text": """You are provided output format which is a list of json object with required keys which is important from an legal perspective. You have to capture all the instance json object with following keys,
                       'Name of the patient': (Name of the patient), 'Date of birth of the patient': (Date of birth of the patient. The Dates are present in (MM/DD/YYYY) or (MM/DD/YY) format, Document as it is ),'Gender of the patient': (Gender of the patient),'Age of the patient': (Age of the patient),'Past Medical History': (Past medical history of the patient),'Past Surgical History': (Past surgical history of the patient),'Allergies': (Alleries patient possesess),'Social History': (Social History of the patient),'Family History': (Family members' medical history or any known hereditary conditions in the family of the patient),'Date of Injury': (Date of current injury. The Dates are present in (MM/DD/YYYY) or (MM/DD/YY) format, Document as it is ),'Injury Details': (Type of Injury-Location of Injury (body part)-Severity of Injury (mild, moderate, severe)-Was this an accident case? (Yes/No)-),'Description of Injury': (Provide a detailed description of current injury),'Accident Details': (If applicable then provide these info, Type of Accident-,Description of how the accident happened- ,Location of the accident- , Were there any witnesses? (Yes/No)- ,If yes, provide their contact information': (were any traffic or safety violations involved? (Yes/No)- , If yes, describe the violations- ,Was a police report filed? (Yes/No)- ,If yes, provide the report number and issuing authority- .),'Immediate Treatment': (First aid given at the scene- ,Transport to medical facility- ,Initial medical treatment received- ),'Medical Conditions': (Gather comprehensive information about the patient's medical conditions, and any medical issues reported by the patient or documented),'Prior Injury Details': (Any significant past injuries patient have had in the past),'Pain Level and Descriptions': (Pain level and their descriptions patient is suffering over time as noted in the medical document),'Patient Progress': (Extract details regarding the patient's progress over time as noted in the medical document),'Impact and Consequences': (Potential impact and consequences, work status, and restrictions reflecting the severity of the injuries and recovery time resulting from the event),'Emotional Impact': (Any information related to emotional impact, including visits to mental health provider)
                        'Physical Deficits': (Identify and list any physical deficits mentioned in the document, including impairments or loss of function in the patient's physical body),'Conditions Pre/Post Incident': (Demarcate and extract information differentiating the patient's condition prior to and after the incident/event),'Insurance Claims': (Any information related to insurance claims (if available)),'Summary': ({summary_query}),'Treatment details'( Comprehensively list all treatments related to the mass tort device/product or its resulting injuries, including medication names, dosages, surgeries (type, date, body part),any medical procedures, recommendations, provider details, and all relevant dates). Here is the document text:""",
            },
            {
                "type": "text",
                "text": "<ocr_text_placeholder>"
            },
            {
                "type": "text",
                "text": """<instruction> Output should be list of JSON object with keys, 'Name of the patient', 'Date of birth of the patient','Gender of the patient','Age of the patient','Past Medical History','Past Surgical History','Allergies','Social History','Family History','Date of Injury','Injury Details','Description of Injury','Accident Details','Immediate Treatment','Medical Conditions','Prior Injury Details','Pain Level and Descriptions','Patient Progress','Impact and Consequences','Emotional Impact','Physical Deficits','Conditions Pre/Post Incident','Insurance Claims','Summary','Treatment details' </instruction>
                        <instruction>Strictly conform to following data type for values, 'Name of the patient': (string), 'Date of birth of the patient': (MM/DD/YYYY),'Gender of the patient': (string),'Age of the patient': (integer),'Past Medical History': (string),'Past Surgical History': (string),'Allergies': (string),'Social History': (string),'Family History': (string),'Date of Injury': (MM/DD/YYYY)),'Injury Details': (string),'Description of Injury': (string),'Accident Details': (string),'Immediate Treatment': (string),'Medical Conditions': (string),'Prior Injury Details': (string),'Pain Level and Descriptions': (string),'Patient Progress': (string),'Impact and Consequences': (string),'Emotional Impact': (string),'Physical Deficits': (string),'Conditions Pre/Post Incident': (string),'Insurance Claims': (string),'Summary': (string), 'Treatment details' (string) </instruction>
                        <instruction> If certain Information is unavailable, Strictly follow the format above and document the value as "not available" </instruction> """
            },

        ],
    }
]



treatment_message = [
    {
        "role": "user",
        "content": [
            {
                "type": "text",
                "text": """You are provided output format which is a list of json object with required keys which is important from an legal perspective. You have to capture all the instance json object with following keys, For each current treatment, document the treatment details 'Current treatment' :('Treatment name': (Name of the treatment ) , 'CPT code' : (CPT code corresponding to the treatment) , 'Frequency and duration': (Frequency and duration of the treatment), 'Description of the treatment': (elaborate Description of the treatment), 'Purpose and expected outcomes' :  (Purpose and expected outcomes of the treatment)),
                            'Future treatment': (For each current treatment, document the treatment details and also, based on the current treatments and their outcomes, speculate potential future treatments.  Consider the progression of the condition, potential complications, and standard medical practices.  Use the CPT codes to find related procedures and treatments that might follow or complement the current treatments. Document the following: 
                            'Future Treatment name': (Name of the recommended future treatment ) , 'Future treatment CPT code' : (CPT code corresponding to the recommended treatment) , 'Frequency and duration of the future treatment': (Frequency and duration of the treatment), 'Description of the treatment': (elaborate Description of the recommended future treatment), 'Purpose and expected outcomes of future treatment' :(Why it might be necessary) ). Here is the document text:""",
            },
            {
                "type": "text",
                "text": "<ocr_text_placeholder>"
            },
            {
                "type": "text",
                "text": """<instruction> Output should be list of JSON object with keys, Current treatment','Future treatment' </instruction>
                     <instruction>Strictly conform to following data type for values, 'Current treatment' : ('Treatment name':(string) , 'CPT code' : (string), 'Frequency and duration': (string), 'Description of the treatment':(string), 'Purpose and expected outcomes' :(string)), 'Future treatment': ('Future Treatment name':(string) , 'Future treatment CPT code' : (string), 'Frequency and duration of the future treatment': (string), 'Description of the future treatment':(string), 'Purpose and expected outcomes of future treatment' :(string)) </instruction>
                    <instruction> If certain Information is unavailable, Strictly follow the format above and document the value as "not available" </instruction> """
            },

        ],
    }
]

mass_tort_message= [
    {
        "role": "user",
        "content": [
            {
                "type": "text",
                "text": """  You are provided output format which is a list of json objects with required keys which is important from an legal perspective. You have to capture all the instances of json object with following keys,'Date of Documented initial product usage' (Specify the earliest documented date when the medication, medical device, or identified harmful exposure associated with the mass tort claim was first used, prescribed, implanted, or encountered by the claimant. This date may refer to the initial prescription, purchase, administration, implantation, or first-known exposure that allegedly contributed to the injury or condition in question. Document only if relevant date is available), 'Duration of Medication/Device Usage /Exposure' (Identify the date range from the first documented use of the medication, device, or exposure to the last recorded date, as stated in the claim or medical records),'Symptoms Reported Date' (Identify the first documented date when the symptoms started related to any of the qualifying injuries in claim),'Confirmed Diagnosis Date' (Identify the date when the diagnosis related to any of the qualifying injuries were confirmed), 'Diagnosed age' (Identify the age of the patient at which the diagnosis related to any of the qualifying injuries were confirmed). Here is the document text:""",
            },
            {
                "type": "text",
                "text": "<ocr_text_placeholder>"
            },
            {
                "type": "text",
                "text": """<instruction> Output should be list of JSON object with keys, 'Date of Documented initial product usage', 'Duration of Medication/Device Use/Exposure' ,'Symptoms Reported Date' ,'Confirmed Diagnosis Date' , 'Diagnosed age'  </instruction>
                     <instruction>Strictly conform to following data type for values, 'Date of Documented initial product usage': (MM/DD/YYYY) , 'Duration of Documented Medication/Device Use/Exposure' : (string) ,'Symptoms Reported Date' : ((MM/DD/YYYY),'Confirmed Diagnosis Date' : (MM/DD/YYYY), 'Diagnosed age' : (string) </instruction>
                     <instruction> If certain Information is unavailable, Strictly follow the format above and document the value as "not available" </instruction> """

            },

        ],
    }
]





def get_system_prompt(extraction_type,template_id,context):
    """Returns the appropriate system prompt based on the extraction type."""
    if extraction_type == "icd_code":
        return "You are an advanced extraction assistant specializing in medical documents. You are given a personal medical document, You're tasked with extracting information from a medical document related to ICD (International Classification of Diseases) codes. Your goal is to compile a list of all ICD codes along with their descriptions, any associated dates, and corresponding UAHBTDRS codes, but only if either the ICD code or its description is extracted from the same page. ICD codes can vary in length and format. ICD codes contain code for diseases, signs and symptoms, abnormal findings, complaints, social circumstances, and external causes of injury or diseases."
    elif extraction_type == "cpt_code":
        return "You are an advanced extraction assistant specializing in medical documents. You are given a personal medical document, You're tasked with extracting information from a medical document related to CPT (Current Procedural Terminology) codes. Your goal is to compile a list of all CPT codes along with their descriptions, any associated dates, and corresponding UAHBTDRS codes, but only if either the CPT code or its description is extracted from the same page. CPT codes can vary in length and format. CPT codes are a set of 5 digit numberic medical codes that help healthcare professionals report and describe medical procedures and services."        
    elif extraction_type == "medication":  
         return "You are an advanced extraction assistant specializing in medical documents. You are given a personal medical document, You're tasked with extracting information from a medical document related to medications. Your goal is to compile a list of all the medications along with their detailed descriptions and dosage, any associated dates, and corresponding UAHBTDRS codes, but only if either the medication or its description is extracted from the same page."  
    elif extraction_type == "future_treatment_summary":  
         return "You are an advanced extraction assistant specializing in medical documents. You are given a personal medical document, You're tasked with extracting information related to patient's current condition and treatment plans from a medical document  . Your task is to extract specific patient's current condition and treatment plan's details in chronological order for each occurrence. Your goal is to compile a list of all patient's treatment plan along with their descriptions, any associated dates, and corresponding UAHBTDRS codes, but only if either the treatment plan or its description is extracted from the same page"
    elif extraction_type == "chronological_summary":  
         return "You are an advanced extraction assistant specializing in medical documents. You are given a personal medical document, You're tasked with extraction of data to create a detailed summary from the provided document including all the relevant data"
    elif extraction_type == "pain":  
        return "You are an advanced extraction assistant specializing in medical documents. You are given a medical document, You're tasked with extracting information from a medical document related to pain. Your goal is to compile a list of all the pain descriptions along with their severity rating (if available) and ICD codes, associated dates of pain, and corresponding UAHBTDRS codes, but only if either the pain description or its severity rating is extracted from the same page."
    elif extraction_type == "prior_injuries":  
         return "You are an advanced extraction assistant specializing in medical documents. You are given a medical personal document, You're tasked with extracting information related to patient's prior injuries from a medical document  . Your task is to extract specific patient's prior injuries and details in chronological order for each occurrence. Your goal is to compile a list of all patient's prior injuries along with their descriptions, any associated dates, and corresponding UAHBTDRS codes, but only if either the prior injuries or its description is extracted from the same page"
    elif extraction_type == "diagnostic_study_summary":  
         return "You are an advanced extraction assistant specializing in medical documents. You are given a personal medical  document, You're tasked with extraction of data to create a summary from the provided document"
    elif extraction_type == "case_info_summary":  
         summary= "You are an advanced extraction assistant specializing in medical documents. You are given a personal medical document, You're tasked with extraction of data to create a summary from the provided document"
         mass_tort_context="Here is some additional context about the case, "+context
        
        # Type of Mass Tort: Dangerous Drug/Medication. Medication prescribed was Depo Provera or Medroxyprogesterone acetate injections. The qualifying injuries the patient has experienced related to the mass tort lawsuit are: brain tumour
        #  Here is Case Summary / Additional Comments : Please provide a full summary of any/all mention of Depo Provera or Medroxyprogesterone acetate injections, including but not limited to NDC codes, injection dates, Manufacturer information, and lot numbers.  Note any radiation both related and unrelated to diagnosis, Neurofibromatosis Type 2 diagnosis, any mention of pregnancy, HPV positive diagnosis, hormone replacement therapy, and breast cancer diagnosis.
        
                #  Type of Mass Tort: Dangerous Drug/Medication. medication prescribed was  Ozempic or Wegovy or Monjauro. The qualifying injuries the patient has experienced related to the mass tort lawsuit are:NAION (Non-arteric anterior ischemic optic neuropathy (sudden & permanent vison loss). Here is Case Summary / Additional Comments : Note all Ozempic usage, chronologically. Note any bariatric surgery pre- Ozempic usage. Note any abdominal surgeries on or near the stomach that could injure the vagus nerve. Note any history of abdominal radiation. Note any current or history of illicit drug usage. Note any current or history of marijuana dependency. Note any personal history of intestinal blockage pre-Ozempic. Note any family history of intestinal blockage. Note any personal history of lupus or Ehlers-Danlos syndrome. Note any history of cystic fibrosis or multiple sclerosis. Note any personal or family history of NAION. Note any personal history of diabetic retinopathy. Note whether they have high cholesterol or hyperlipidemia or hypertension

         if template_id==2:
            summary= summary + mass_tort_context
         return summary
    elif extraction_type == "injuries":  
         return "You are an advanced extraction assistant specializing in medical documents. You are given a personal medical document, You're tasked with extracting information from a medical document related to injuries. Your task is to extract specific injury details in chronological order for each occurrence. Your goal is to compile a list of all Injuries along with their descriptions, any associated dates, and corresponding UAHBTDRS codes, but only if either the injury or its description is extracted from the same page."
    elif extraction_type == "mass_tort":  
         return "You are an advanced extraction assistant specializing in medical documents, tasked with extracting mass tort lawsuit details in personal medical document. Type of Mass Tort: Dangerous Drug/Medication. medication prescribed was Ozempic or Wegovy or Monjauro. The qualifying injuries the patient has experienced related to the mass tort lawsuit are: NAION (Non-arteric anterior ischemic optic neuropathy (sudden & permanent vison loss). Here is Case Summary / Additional Comments : Note all Ozempic usage, chronologically. Note any bariatric surgery pre- Ozempic usage. Note any abdominal surgeries on or near the stomach that could injure the vagus nerve. Note any history of abdominal radiation. Note any current or history of illicit drug usage. Note any current or history of marijuana dependency. Note any personal history of intestinal blockage pre-Ozempic. Note any family history of intestinal blockage. Note any personal history of lupus or Ehlers-Danlos syndrome. Note any history of cystic fibrosis or multiple sclerosis. Note any personal or family history of NAION. Note any personal history of diabetic retinopathy. Note whether they have high cholesterol or hyperlipidemia or hypertension "

def get_message_list(extraction_type,template_id):
    """Returns the appropriate message list based on the extraction type."""
    if extraction_type == "icd_code":
        return icd_code_message
    elif extraction_type == "cpt_code":
        return cpt_code_message
    elif extraction_type == "medication":
        return medication_message
    elif extraction_type == "injuries":
        return injuries_message
    elif extraction_type == "prior_injuries":
        return prior_injuries_message
    elif extraction_type == "future_treatment_summary":
        return treatment_message
    elif extraction_type == "chronological_summary":
        return chronological_summary_message
    elif extraction_type == "diagnostic_study_summary":
        return diagnostic_summary_message
    elif extraction_type == "case_info_summary": 
        summary_pi="Concise summary of the accident or incident the patient involved based on the medical records. Include key details such as the date, nature of the accident, the specific injuries sustained, initial symptoms, treatment received, any documented impact on the patient's physical and emotional well-being, and any noted limitations in daily activities or work. Only include information explicitly stated in the records."
        summary_masstort="Summarize the patient's mass tort claim by stating the type of claim, date of first usage, implantation, or exposure.1. List all details of the injuries/defects caused due to the mass-tort's claimed product. 2. Document all treatments received, including prescribed medications, hospitalizations, and surgeries. Ensure the summary is concise yet comprehensive, focusing only on the medical history relevant to the claim"
        summary_query = summary_pi if template_id == 1 else summary_masstort

        for item in case_info_summary_message[0]["content"]:
            if "{summary_query}" in item["text"]:
                item["text"] = item["text"].replace("{summary_query}", summary_query)

        return case_info_summary_message
    elif extraction_type == "pain":
        return pain_message
    elif extraction_type == "mass_tort":
        return mass_tort_message