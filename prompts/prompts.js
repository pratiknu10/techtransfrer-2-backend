export const CAT_01 = [
  {
    role: "user",
    content: [
      {
        type: "text",
        text: "i will give you the data related to this Category name : Process Definition, Description : End-to-end process description & flows; CPP/CQA intent. You are provided output format which is a list of json object with required keys which is important from an legal perspective. You have to capture all the instance of End-to-end process description & flows, CPP/CQA intent json object with following keys, 'Product Name' (Commercial/product name of a product of CDMO like Ibuprofen.), 'Strength' (Strength string, example 200 mg), Dosage_Form (Dosage Form , generally in  Tablet form), CQA (Critical Quality Attribute label. generatlly are in Assay, D50), CPP (Critical Process Parameter label generally in RPM, Temp), 'UAHBTDRS CODE' (Extract the UAHBTDRS_CODE from the page header where the relevant information is found - look for 'UAHBTDRS_CODE: X' at the beginning of each page section before the ---END_OF_PAGE--- marker) . Here is the document text:",
      },
      {
        type: "text",
        text: "<ocr_text_placeholder>",
      },
      {
        type: "text",
        text: `<instruction> Output MUST be a JSON ARRAY format starting with [ and ending with ]. Create one JSON object for EACH UAHBTDRS_CODE you find in the document. Even if you find only one UAHBTDRS_CODE, wrap it in an array [{}]. Each object should include 'Category_Name', 'Document_Name', 'Product_Name', 'Strength', 'Dosage_Form', 'CQA', 'CPP', 'UAHBTDRS CODE'. </instruction>
                        <instruction> The 'Category_Name' field must ALWAYS be set to "Process Definition" - this is the extraction category type. </instruction>
                        <instruction> The 'Document_Name' field should contain the actual title or name of the document being processed (e.g., "Analytical Method SOPs", "Reference Standards", etc.) as found in the document. </instruction>
                        <instruction> Strictly conform to following data type for values: 'Category_Name': (string - ALWAYS "Process Definition"), 'Document_Name': (string), 'CQA' : (list), 'CPP' : (list), 'Product_Name': (string), 'Strength': (string), 'Dosage_Form': (string), 'UAHBTDRS CODE' : (integer) </instruction>
                        <instruction> For 'UAHBTDRS CODE', create a separate JSON object for each UAHBTDRS_CODE you encounter. ALWAYS return in ARRAY format: [{"UAHBTDRS CODE": 1, ...}, {"UAHBTDRS CODE": 4, ...}]. If you see UAHBTDRS_CODE: 1, create one object. If you see UAHBTDRS_CODE: 4, create another object. Each UAHBTDRS_CODE should generate its own JSON object. </instruction>
                        <instruction> Do not assume or generate information, Document  relevant information to CQA and CPP </instruction>
                        <instruction> If Information is unavailable, follow the format and document the value as "not available" </instruction>
                        <instruction> CRITICAL: Your response must start with [ and end with ] to be a valid JSON array. Example: [{"Category_Name": "Process Definition", "UAHBTDRS CODE": 1}, {"Category_Name": "Process Definition", "UAHBTDRS CODE": 4}] </instruction>
                      `,
      },
    ],
  },
];

export const CAT_02 = [
  {
    role: "user",
    content: [
      {
        type: "text",
        text: "i will give you the data related to this Category name : Manufacturing Recipe & Automation, Description : ISA-88 breakdown, phases, parameters, interlocks, alarms, state model, scaling; CPP/CQA intent. You are provided output format which is a list of json object with required keys which is important from an legal perspective. You have to capture all the instance of intent json object with following keys, 'Unit_Procedure' (ISA-88 unit procedure name, Example : Dissolution.), 'Phase_Name' (ISA-88 phase name, Mix), 'Setpoint' (Target value at phase for CPP, example: 300), 'PAR_Min' (PAR lower bound),'Operating_Range_Min' (Lower operating bound, Example: 250), 'Operating_Range_Max' (Upper operating bound, example:350), 'UAHBTDRS CODE' (Extract the UAHBTDRS_CODE from the page header where the relevant information is found - look for 'UAHBTDRS_CODE: X' at the beginning of each page section before the ---END_OF_PAGE--- marker) . Here is the document text:",
      },
      {
        type: "text",
        text: "<ocr_text_placeholder>",
      },
      {
        type: "text",
        text: `<instruction> Output MUST be a JSON ARRAY format starting with [ and ending with ]. Create one JSON object for EACH UAHBTDRS_CODE you find in the document. Even if you find only one UAHBTDRS_CODE, wrap it in an array [{}]. Each object should include 'Category_Name', 'Document_Name', 'Unit_Procedure', 'Phase_Name', 'Setpoint', 'PAR_Min', 'Operating_Range_Min', 'Operating_Range_Max', 'UAHBTDRS CODE'. </instruction>
                        <instruction> The 'Category_Name' field must ALWAYS be set to "Manufacturing Recipe & Automation" - this is the extraction category type. </instruction>
                        <instruction> The 'Document_Name' field should contain the actual title or name of the document being processed as found in the document. </instruction>
                        <instruction> Strictly conform to following data type for values: 'Category_Name': (string - ALWAYS "Manufacturing Recipe & Automation"), 'Document_Name': (string), 'Unit_Procedure': (string), 'Phase_Name': (string), 'Setpoint': (number), 'PAR_Min': (number), 'Operating_Range_Min': (number), 'Operating_Range_Max': (number), 'UAHBTDRS CODE' : (integer) </instruction>
                        <instruction> For 'UAHBTDRS CODE', create a separate JSON object for each UAHBTDRS_CODE you encounter. ALWAYS return in ARRAY format: [{"UAHBTDRS CODE": 1, ...}, {"UAHBTDRS CODE": 4, ...}]. If you see UAHBTDRS_CODE: 1, create one object. If you see UAHBTDRS_CODE: 4, create another object. Each UAHBTDRS_CODE should generate its own JSON object. </instruction>
                        <instruction> Do not assume or generate information </instruction>
                        <instruction> If Information is unavailable, follow the format and document the value as "not available" </instruction>
                        <instruction> CRITICAL: Your response must start with [ and end with ] to be a valid JSON array. Example: [{"Category_Name": "Manufacturing Recipe & Automation", "UAHBTDRS CODE": 1}, {"Category_Name": "Manufacturing Recipe & Automation", "UAHBTDRS CODE": 4}] </instruction>
                      `,
      },
    ],
  },
];
