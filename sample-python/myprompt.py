"CAT-01" = [
    {
        "role": "user",
        "content": [
            {
                "type": "text",
                "text": "i will give you the data related to this Category name : Process Definition, Description : End-to-end process description & flows; CPP/CQA intent. You are provided output format which is a list of json object with required keys which is important from an legal perspective. You have to capture all the instance of End-to-end process description & flows, CPP/CQA intent json object with following keys, 'Product Name' (Commercial/product name of a product of CDMO like Ibuprofen.), 'Strength' (Strength string, example 200 mg), Dosage_Form (Dosage Form , generally in  Tablet form), CQA (Critical Quality Attribute label. generatlly are in Assay, D50), CPP (Critical Process Parameter label generally in RPM, Temp), 'UAHBTDRS CODE' (Extract the UAHBTDRS_CODE, which appears on the same page as the above extracted relevant information) . Here is the document text:",
            },
            {
                "type": "text",
                "text": "<ocr_text_placeholder>"
            },
            {
                "type": "text",
                "text": """<instruction> Output should be list of JSON object with 'Category_Name', 'Product_Name', 'Strength', 'Dosage_Form', 'CQA', 'CPP', 'UAHBTDRS CODE'. </instruction>
                        <instruction> Strictly conform to following data type for values, 'CQA' : (list), 'CPP' : (list ), 'Product_Name', 'Strength': (string), 'Dosage_Form': (string),'Strength' : (string), 'UAHBTDRS CODE' : (integer) </instruction>
                        <instruction> Do not assume or generate information, Document only relevant information to CQA and CPP </instruction> 
                        <instruction> If Information is unavailable, follow the format and document the value as "not available" </instruction> 
                      """
            },

        ],
    }
]