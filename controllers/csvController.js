import * as XLSX from 'xlsx';
import fs from 'fs';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const convertCsvToJson = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileBuffer = req.file.buffer;
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

    // Get the first sheet
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Convert to JSON with headers
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (data.length < 2) {
      return res.status(400).json({ error: 'File must contain headers and at least one row of data' });
    }

    // Find column indices for "Tag_Name" and "Description"
    const headers = data[0];
    let tagColumnIndex = -1;
    let descriptionColumnIndex = -1;

    headers.forEach((header, index) => {
      const normalizedHeader = header?.toString().toLowerCase().trim() || '';

      // Look for Tag_Name column (exact or similar)
      if (normalizedHeader === 'tag_name' ||
          normalizedHeader === 'tagname' ||
          normalizedHeader === 'tag name' ||
          normalizedHeader === 'tag') {
        tagColumnIndex = index;
      }

      // Look for Description column (exact or similar)
      if (normalizedHeader === 'description' ||
          normalizedHeader === 'desc' ||
          normalizedHeader === 'descriptions') {
        descriptionColumnIndex = index;
      }
    });

    if (tagColumnIndex === -1 || descriptionColumnIndex === -1) {
      return res.status(400).json({
        error: 'Required columns not found. Please ensure your file contains "Tag_Name" and "Description" columns',
        foundHeaders: headers,
        searchedFor: ['Tag_Name', 'Description']
      });
    }

    // Process data rows (skip header row)
    const results = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const tag = row[tagColumnIndex]?.toString().trim();
      const description = row[descriptionColumnIndex]?.toString().trim();

      if (tag && description) {
        results.push({
          tag,
          description
        });
      }
    }

    // Add AI-powered synonym and similarity enhancement
    const { enhance_with_ai = false } = req.body;

    let enhancedResults = results;

    if (enhance_with_ai && results.length > 0) {
      console.log('Enhancing results with AI-powered synonyms and similarities...');
      try {
        enhancedResults = await enhanceWithAI(results);
        console.log(`Enhanced ${results.length} items with AI synonyms`);
      } catch (aiError) {
        console.error('AI enhancement failed:', aiError);
        // Continue with original results if AI fails
      }
    }

    res.json({
      success: true,
      count: enhancedResults.length,
      enhanced_with_ai: enhance_with_ai,
      data: enhancedResults
    });

  } catch (error) {
    console.error('CSV to JSON conversion error:', error);
    res.status(500).json({
      error: 'Failed to process file',
      details: error.message
    });
  }
};

// AI enhancement function to find synonyms and similarities
async function enhanceWithAI(items) {
  const enhancedItems = [];

  // Process items in batches to avoid overwhelming the API
  const batchSize = 5;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    try {
      const batchResults = await Promise.all(
        batch.map(item => enhanceSingleItem(item))
      );
      enhancedItems.push(...batchResults);
    } catch (batchError) {
      console.error(`Error processing batch ${i / batchSize + 1}:`, batchError);
      // Add original items if AI enhancement fails
      enhancedItems.push(...batch);
    }
  }

  return enhancedItems;
}

async function enhanceSingleItem(item) {
  try {
    const prompt = `
Given this tag and description pair, generate synonyms and similar terms that could be used to search for the same concept:

Tag: "${item.tag}"
Description: "${item.description}"

Please provide:
1. 3-5 synonyms for the tag
2. 3-5 alternative descriptions with similar meaning
3. Related technical terms

Return as JSON format:
{
  "tag_synonyms": ["synonym1", "synonym2", ...],
  "description_alternatives": ["alt1", "alt2", ...],
  "related_terms": ["term1", "term2", ...]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 500
    });

    const aiResponse = response.choices[0].message.content.trim();

    // Try to parse the JSON response
    let aiEnhancement;
    try {
      aiEnhancement = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', aiResponse);
      throw parseError;
    }

    return {
      ...item,
      ai_enhanced: true,
      tag_synonyms: aiEnhancement.tag_synonyms || [],
      description_alternatives: aiEnhancement.description_alternatives || [],
      related_terms: aiEnhancement.related_terms || [],
      search_terms: [
        item.tag,
        ...(aiEnhancement.tag_synonyms || []),
        ...(aiEnhancement.related_terms || [])
      ].filter(Boolean).slice(0, 10) // Limit to 10 search terms
    };

  } catch (error) {
    console.error(`AI enhancement failed for item "${item.tag}":`, error);
    // Return original item if AI enhancement fails
    return {
      ...item,
      ai_enhanced: false,
      tag_synonyms: [],
      description_alternatives: [],
      related_terms: [],
      search_terms: [item.tag]
    };
  }
}