import openai from '../config/openai.js';

export const semanticSearch = async (content, query, description) => {
  try {
    // Log each prompt execution with tag and description
    console.log('\n=== PROMPT EXECUTION ===');
    console.log(`Tag: "${query}"`);
    console.log(`Description: "${description}"`);
    console.log(`Content length: ${content.length} characters`);
    console.log('========================\n');

    const prompt = `
You are analyzing a document for gap analysis in tech transfer projects.

Document content: "${content}"

Search for information related to:
Tag: "${query}"
Description: "${description}"

IMPORTANT: When searching for the Tag, consider these natural language variations:
- Underscores (_) in tags should match spaces in documents (e.g., "Product_Name" matches "product name")
- CamelCase or compound words may appear as separate words in documents
- Technical database naming conventions may appear as natural language in documents
- Examples:
  • "Product_Name" → look for "product name", "commercial name", "product title"
  • "Operating_Range_Min" → look for "minimum operating range", "lower operating limit", "min range"
  • "Unit_Procedure" → look for "unit procedure", "procedure", "process procedure"
  • "Data_Capture_Field" → look for "data field", "capture field", "data capture"

Rate the relevance of this document section to BOTH the tag concept and description on a scale of 0.0 to 1.0, where:
- 1.0 = Perfect match (exact terminology, natural variations, or clear context)
- 0.8-0.9 = Very relevant (similar terminology, natural language equivalents, or clear context match)
- 0.6-0.7 = Moderately relevant (related concepts, partial match, or conceptual similarity)
- 0.4-0.5 = Somewhat relevant (tangentially related)
- 0.0-0.3 = Not relevant

Respond with only a number between 0.0 and 1.0 representing the relevance score.
`;

    // Log the complete prompt being sent to LLM
    console.log('\n╔════════════════════════════════════════════════════════════════════════╗');
    console.log('║                     FINAL PROMPT BEING SENT TO LLM                      ║');
    console.log('╠════════════════════════════════════════════════════════════════════════╣');
    console.log(`║ TAG: "${query}"`);
    console.log(`║ DESCRIPTION: "${description}"`);
    console.log('╠════════════════════════════════════════════════════════════════════════╣');
    console.log('║ FULL PROMPT:');
    console.log('╟────────────────────────────────────────────────────────────────────────╢');
    console.log(prompt.split('\n').map(line => `║ ${line}`).join('\n'));
    console.log('╚════════════════════════════════════════════════════════════════════════╝\n');

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a document analysis assistant. Respond only with a numeric relevance score between 0.0 and 1.0.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 10
    });

    const score = parseFloat(response.choices[0].message.content.trim());
    const finalScore = isNaN(score) ? 0.0 : Math.min(Math.max(score, 0.0), 1.0);

    console.log(`Score returned: ${finalScore}`);

    return finalScore;

  } catch (error) {
    console.error('OpenAI API error:', error);
    return 0.0;
  }
};


export const enhancedSemanticSearch = async (pages, tag, description, threshold = 0.3) => {
  const results = [];

  console.log('\n=== ENHANCED SEMANTIC SEARCH START ===');
  console.log(`Processing ${pages.length} pages`);
  console.log(`Tag: "${tag}"`);
  console.log(`Description: "${description}"`);
  console.log(`Threshold: ${threshold}`);
  console.log('=====================================\n');

  for (const page of pages) {
    console.log(`\nProcessing page ${page.page_no || 'unknown'}`);
    const score = await semanticSearch(page.content, tag, description);

    if (score >= threshold) {
      console.log(`✓ Page ${page.page_no} meets threshold with score ${score}`);
      results.push({
        doc_id: page.doc_id,
        page_no: page.page_no,
        page_label: page.page_label,
        tag,
        description,
        method: 'semantic',
        score,
        content: page.content
      });
    }
  }

  console.log(`\n=== ENHANCED SEMANTIC SEARCH COMPLETE ===`);
  console.log(`Found ${results.length} results meeting threshold`);
  console.log('=========================================\n');

  return results.sort((a, b) => b.score - a.score);
};