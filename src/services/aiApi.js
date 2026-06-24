// src/services/aiApi.js
import axios from 'axios';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const getAiResponse = async (userMessage, chatHistory = []) => {
  
  if (!GROQ_API_KEY || GROQ_API_KEY === 'gsk_xxxxx' || GROQ_API_KEY === 'YOUR_GROQ_API_KEY') {
    return "⚠️ කණගාටුයි, GROQ API Key එක සොයාගත නොහැක. කරුණාකර .env file එකේ `VITE_GROQ_API_KEY` එක නිවැරදිව දාන්න.";
  }

  try {
    const response = await axios.post(
      GROQ_BASE_URL,
      {
        // ✅ මෙය දැනට Groq එකේ ඇති හොඳම සහ Supported Model එකයි
        model: 'llama-3.3-70b-versatile', 
        
        messages: [
          { 
            role: 'system', 
            content: `ඔබ NASA, අභ්‍යවකාශ විද්‍යාව, තාරකා විද්‍යාව සහ කාලගුණය පිළිබඳ මිත්‍රශීලී හා බුද්ධිමත් AI සහායකයෙක්. 
            පාරිභෝගිකයාගේ ප්‍රශ්නවලට හරියටම හා පැහැදිලිව උත්තර දෙන්න. ඔබට සිංහලෙන් හෝ ඉංග්‍රීසියෙන් ප්‍රශ්න එවිය හැක. 
            කාලගුණය, ග්‍රහලෝක, තාරකා, කළු කුහර, APOD, සහ අඟහරු ගැන විශේෂ දැනුමක් ඇත.` 
          },
          ...chatHistory,
          { role: 'user', content: userMessage }
        ],
        max_tokens: 800,
        temperature: 0.7,
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.choices[0].message.content;

  } catch (error) {
    console.error('Groq API Error:', error);
    if (error.response) {
      const errorMsg = error.response.data.error?.message || 'නොදන්නා දෝෂයක්';
      // Model decommission error එක හඳුනාගැනීම
      if (errorMsg.includes('decommissioned')) {
        return `❌ Groq model එක යාවත්කාලීන කර ඇත. කරුණාකර Server එක Restart කරන්න. (මෙම දෝෂය විසඳා ඇත)`;
      }
      return `❌ Groq API දෝෂයක්: ${errorMsg}`;
    }
    return '❌ Groq සේවාව සමඟ සම්බන්ධ වීමේ දෝෂයක්. ඔබගේ අන්තර්ජාල සම්බන්ධතාවය පරීක්ෂා කරන්න.';
  }
};