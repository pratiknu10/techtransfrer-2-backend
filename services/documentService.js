import PDFParser from 'pdf2json';

export const processDocument = async (buffer, url, filename) => {
  console.log('\n--- processDocument called ---');
  console.log('Buffer size:', buffer ? buffer.length : 'No buffer');
  console.log('Filename:', filename);
  console.log('URL:', url);

  return new Promise((resolve, reject) => {
    try {
      console.log('Creating PDF parser instance...');

      // Validate buffer
      if (!buffer || buffer.length === 0) {
        console.log('ERROR: Invalid or empty buffer');
        reject(new Error('Invalid or empty PDF buffer'));
        return;
      }

      console.log('PDFParser version:', PDFParser.version || 'Unknown');
      const pdfParser = new PDFParser(null, 1);
      console.log('PDFParser instance created successfully');

      pdfParser.on("pdfParser_dataError", (errData) => {
        console.error('\n--- PDF PARSER DATA ERROR EVENT ---');
        console.error('Error Data:', errData);
        console.error('Parser Error:', errData.parserError);
        console.error('-----------------------------------\n');
        reject(new Error(`PDF parsing failed: ${errData.parserError || 'Unknown error'}`));
      });

      pdfParser.on("pdfParser_dataReady", (pdfData) => {
        console.log('\n--- PDF PARSER DATA READY EVENT ---');
        console.log('Pages found:', pdfData.Pages ? pdfData.Pages.length : 0);

        try {
          const pages = [];
          let fullText = '';

          pdfData.Pages.forEach((page, pageIndex) => {
            let pageText = '';

            if (page.Texts) {
              page.Texts.forEach((textItem) => {
                if (textItem.R && textItem.R.length > 0) {
                  textItem.R.forEach((textRun) => {
                    if (textRun.T) {
                      const decodedText = decodeURIComponent(textRun.T);
                      pageText += decodedText + ' ';
                    }
                  });
                }
              });
            }

            if (pageText.trim()) {
              pages.push({
                page_no: pageIndex + 1,
                page_label: (pageIndex + 1).toString(),
                content: pageText.trim(),
                doc_id: filename
              });
            }

            fullText += pageText + '\n';
          });

          if (pages.length === 0) {
            pages.push({
              page_no: 1,
              page_label: "1",
              content: "No text content found",
              doc_id: filename
            });
          }

          resolve({
            filename,
            url,
            totalPages: pdfData.Pages.length,
            pages,
            text: fullText
          });
        } catch (processError) {
          reject(new Error(`Document processing failed: ${processError.message}`));
        }
      });

      // Parse the PDF buffer
      try {
        console.log('Calling pdfParser.parseBuffer()...');
        console.log('Buffer type:', typeof buffer);
        console.log('Buffer constructor:', buffer.constructor.name);
        console.log('First 10 bytes:', buffer.slice(0, 10));

        pdfParser.parseBuffer(buffer);
        console.log('parseBuffer() called successfully');
      } catch (parseError) {
        console.error('\n--- PARSE BUFFER ERROR ---');
        console.error('Error:', parseError);
        console.error('Message:', parseError.message);
        console.error('Stack:', parseError.stack);
        console.error('--------------------------\n');
        reject(new Error(`Failed to parse PDF: ${parseError.message}`));
      }
    } catch (error) {
      console.error('\n--- DOCUMENT PROCESSING ERROR ---');
      console.error('Error:', error);
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
      console.error('----------------------------------\n');
      reject(new Error(`Document processing failed: ${error.message}`));
    }
  });
};

export const searchInDocument = (pages, searchTerm, searchType = 'exact') => {
  const results = [];

  for (const page of pages) {
    let score = 0;
    let found = false;

    if (searchType === 'exact') {
      const regex = new RegExp(searchTerm, 'gi');
      const matches = page.content.match(regex);
      if (matches) {
        found = true;
        score = 1.0;
      }
    } else {
      const normalizedContent = page.content.toLowerCase();
      const normalizedTerm = searchTerm.toLowerCase();

      if (normalizedContent.includes(normalizedTerm)) {
        found = true;
        score = 0.8;
      } else {
        const words = normalizedTerm.split(' ');
        let matchedWords = 0;

        words.forEach(word => {
          if (normalizedContent.includes(word)) {
            matchedWords++;
          }
        });

        if (matchedWords > 0) {
          found = true;
          score = matchedWords / words.length * 0.6;
        }
      }
    }

    if (found) {
      results.push({
        doc_id: page.doc_id,
        page_no: page.page_no,
        page_label: page.page_label,
        method: searchType,
        score,
        content: page.content
      });
    }
  }

  return results.sort((a, b) => b.score - a.score);
};