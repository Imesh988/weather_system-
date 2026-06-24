<template>
  <div class="chatbot-container">
    <!-- ශීර්ෂය -->
    <div class="chatbot-header">
      <h3>🤖 NASA + AI බුද්ධිමත් සහායක</h3>
      <button @click="clearChat" class="clear-btn" title="සංවාදය මකන්න">🗑️</button>
    </div>

    <!-- පණිවිඩ ලැයිස්තුව -->
    <div class="chatbot-messages" ref="messageContainer">
      <div v-for="(msg, index) in messages" :key="index" 
           :class="['message', msg.sender === 'user' ? 'user' : 'bot']">
        <div class="message-content">
          <span class="sender">{{ msg.sender === 'user' ? '👤' : '🤖' }}</span>
          <span class="text" v-html="msg.text"></span>
          <img v-if="msg.image" :src="msg.image" class="msg-image" @error="msg.image = null" />
        </div>
      </div>
      
      <!-- Typing indicator (AI හිතනවා) -->
      <div v-if="isLoading" class="message bot typing">
        <div class="message-content">
          <span class="sender">🤖</span>
          <span class="text typing-dots">
            <span>.</span><span>.</span><span>.</span>
          </span>
        </div>
      </div>
    </div>

    <!-- ආදාන පෙට්ටිය -->
    <div class="chatbot-input">
      <input 
        v-model="userInput" 
        @keyup.enter="sendMessage" 
        placeholder="අහන්න: කොළඹ කාලගුණය, අද පින්තූරය, කළු කුහරය..."
        :disabled="isLoading"
      />
      <button @click="sendMessage" :disabled="isLoading">
        {{ isLoading ? '⏳' : '📤' }}
      </button>
    </div>
  </div>
</template>

<script>
import { getApod, searchNasaImages } from '../services/nasaApi';
import { getWeatherByCity } from '../services/weatherApi';
import { getAiResponse } from '../services/aiApi';

// සිංහල නගර නම් → ඉංග්‍රීසි නගර නම් Map එක (වැඩි කරන ලදී)
const cityNameMap = {
  'කොළඹ': 'Colombo',
  'ගාල්ල': 'Galle',
  'මාතර': 'Matara',
  'මහනුවර': 'Kandy',
  'නුවරඑළිය': 'Nuwara Eliya',
  'බත්තරමුල්ල': 'Battaramulla',
  'යාපනය': 'Jaffna',
  'ත්‍රිකුණාමලය': 'Trincomalee',
  'අනුරාධපුර': 'Anuradhapura',
  'කුරුණෑගල': 'Kurunegala',
  'බදුල්ල': 'Badulla',
  'රත්නපුර': 'Ratnapura',
  'මොරටුව': 'Moratuwa',
  'දෙහිවල': 'Dehiwala',
  'මීගමුව': 'Negombo',
  'ගම්පහ': 'Gampaha',
  'කලුතර': 'Kalutara'
};

export default {
  data() {
    return {
      userInput: '',
      messages: [],
      isLoading: false,
      chatHistory: []
    };
  },
  methods: {
    async sendMessage() {
      const trimmed = this.userInput.trim();
      if (!trimmed || this.isLoading) return;

      this.messages.push({ sender: 'user', text: trimmed });
      this.chatHistory.push({ role: 'user', content: trimmed });
      this.userInput = '';
      this.isLoading = true;
      this.$nextTick(() => this.scrollToBottom());

      try {
        let botReply = '';
        let botImage = null;
        let usedSource = '';

        // --- 1. කාලගුණය හඳුනාගැනීම (Weather) ---
        const weatherKeywords = ['කාලගුණ', 'weather', 'උෂ්ණත්ව', 'temperature', 'වැස්ස', 'rain', 'හිම', 'snow', 'සුළඟ', 'wind', 'ආර්ද්‍රතා', 'humidity'];
        const isWeatherQuery = weatherKeywords.some(kw => trimmed.toLowerCase().includes(kw.toLowerCase()));

        if (isWeatherQuery) {
          let city = null;
          // සිංහල: "කොළඹ කාලගුණය"
          const sinCityMatch = trimmed.match(/^([\u0D80-\u0DFF\w\s]+?)\s*(?:කාලගුණ|weather)/i);
          if (sinCityMatch) {
            let rawCity = sinCityMatch[1].trim();
            city = cityNameMap[rawCity] || rawCity;
          }
          // ඉංග්‍රීසි: "weather in London"
          const engCityMatch = trimmed.match(/weather in (\w+)/i);
          if (engCityMatch) city = engCityMatch[1];
          
          if (!city) city = 'Colombo'; // Default

          const weatherData = await getWeatherByCity(city);
          if (weatherData) {
            const { temp, feels_like } = weatherData.main;
            const desc = weatherData.weather[0].description;
            const humid = weatherData.main.humidity;
            const wind = weatherData.wind.speed;
            const name = weatherData.name;
            const icon = weatherData.weather[0].icon;
            
            botReply = `
              <b>🌤️ ${name} හි කාලගුණය</b><br/>
              🌡️ උෂ්ණත්වය: <b>${temp}°C</b> (දැනෙන්නේ ${feels_like}°C)<br/>
              📖 තත්වය: ${desc}<br/>
              💧 ආර්ද්‍රතාව: ${humid}%<br/>
              💨 සුළං වේගය: ${wind} m/s
            `;
            botImage = `https://openweathermap.org/img/wn/${icon}@4x.png`;
            usedSource = '🌍 OpenWeatherMap';
          } else {
            botReply = `❌ කණගාටුයි, "${city}" නගරයේ කාලගුණය සොයාගත නොහැක. නිවැරදි නගරයක් උත්සාහ කරන්න.`;
          }
        }

        // --- 2. NASA APOD (අද පින්තූරය) ---
        else if (trimmed.toLowerCase().includes('අද පින්තූර') || 
                 trimmed.toLowerCase().includes('apod') ||
                 trimmed.toLowerCase().includes('astronomy picture')) {
          const apod = await getApod();
          if (apod) {
            botReply = `<b>📸 ${apod.title}</b><br/><br/>${apod.explanation}`;
            botImage = apod.url;
            usedSource = '🛰️ NASA APOD';
          } else {
            botReply = '❌ අද අභ්‍යවකාශ පින්තූරය ලබාගැනීම අසාර්ථකයි.';
          }
        }

        // --- 3. NASA පින්තූර සෙවීම (අඟහරු/ගැලැක්සි වගේ) ---
        else if (trimmed.toLowerCase().includes('පින්තූර') || 
                 trimmed.toLowerCase().includes('picture') ||
                 trimmed.toLowerCase().includes('image') ||
                 trimmed.toLowerCase().includes('mars') ||
                 trimmed.toLowerCase().includes('ගැලැක්සි') ||
                 trimmed.toLowerCase().includes('අඟහරු')) {
          const images = await searchNasaImages(trimmed);
          if (images && images.length > 0) {
            const first = images[0];
            const title = first.data?.[0]?.title || 'නිර්නාමික';
            const desc = first.data?.[0]?.description || '';
            botReply = `<b>🖼️ ${title}</b><br/><br/>${desc}`;
            botImage = first.links?.[0]?.href || '';
            usedSource = '🛰️ NASA Image Library';
          } else {
            botReply = `❌ "${trimmed}" සම්බන්ධ පින්තූරයක් හමු නොවීය.`;
          }
        }

        // --- 4. සාමාන්‍ය/අභ්‍යවකාශ ප්‍රශ්න (Groq AI) ---
        else {
          const aiResponse = await getAiResponse(trimmed, this.chatHistory);
          botReply = aiResponse || '🤖 සමාවන්න, මට උත්තරයක් හොයාගන්න බැරි වුණා.';
          usedSource = '🧠 Groq AI';
        }

        // පණිවිඩය එකතු කරන්න (මූලාශ්‍රය පෙන්වීමට)
        this.messages.push({ 
          sender: 'bot', 
          text: botReply + `<br/><br/><span style="font-size: 10px; opacity: 0.5;">📡 මූලාශ්‍රය: ${usedSource}</span>`,
          image: botImage 
        });
        this.chatHistory.push({ role: 'assistant', content: botReply });

      } catch (error) {
        console.error('Chat Error:', error);
        this.messages.push({
          sender: 'bot',
          text: '❌ සමාවන්න, යම් තාක්ෂණික දෝෂයක් සිදු විය. නැවත උත්සාහ කරන්න.'
        });
      } finally {
        this.isLoading = false;
        this.$nextTick(() => this.scrollToBottom());
      }
    },

    clearChat() {
      this.messages = [];
      this.chatHistory = [];
      // පිළිගැනීමේ පණිවිඩය නැවත එකතු කරන්න
      this.messages.push({
        sender: 'bot',
        text: `
          <b>🚀 NASA + කාලගුණ AI සහායකයට සාදරයෙන් පිළිගනිමු!</b><br/><br/>
          මට පුළුවන්:<br/>
          🌤️ <b>කාලගුණය</b> — උදා: "කොළඹ කාලගුණය"<br/>
          📸 <b>අභ්‍යවකාශ පින්තූර</b> — උදා: "අද පින්තූරය"<br/>
          🖼️ <b>NASA පින්තූර සෙවීම</b> — උදා: "අඟහරු පින්තූර"<br/>
          🧠 <b>ඕනෑම ප්‍රශ්නයක්</b> — උදා: "කළු කුහරයක් යනු කුමක්ද?"<br/><br/>
          ඔබට ඕනෑම දෙයක් අසන්න! 🚀
        `
      });
      this.$nextTick(() => this.scrollToBottom());
    },

    scrollToBottom() {
      const container = this.$refs.messageContainer;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  },
  mounted() {
    this.clearChat(); // පිළිගැනීමේ පණිවිඩය පෙන්වීමට
  }
};
</script>

<style scoped>
/* Container */
.chatbot-container {
  background: #0f172a;
  border-radius: 16px;
  border: 1px solid #1e293b;
  display: flex;
  flex-direction: column;
  height: 550px;
  max-height: 550px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0,0,0,0.6);
  font-family: 'Segoe UI', system-ui, sans-serif;
}

/* Header */
.chatbot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #1e293b;
  border-radius: 16px 16px 0 0;
  border-bottom: 1px solid #334155;
  flex-shrink: 0;
}
.chatbot-header h3 {
  color: #e2e8f0;
  font-size: 14px;
  margin: 0;
}
.clear-btn {
  background: #ef4444;
  border: none;
  color: white;
  padding: 4px 10px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: 0.2s;
}
.clear-btn:hover {
  background: #dc2626;
  transform: scale(0.95);
}

/* Messages */
.chatbot-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #0f172a;
}
.chatbot-messages::-webkit-scrollbar {
  width: 4px;
}
.chatbot-messages::-webkit-scrollbar-thumb {
  background: #475569;
  border-radius: 10px;
}

.message {
  display: flex;
  max-width: 88%;
}
.message.user {
  align-self: flex-end;
}
.message.bot {
  align-self: flex-start;
}

.message-content {
  background: #1e293b;
  padding: 10px 14px;
  border-radius: 12px;
  color: #e2e8f0;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
.message.user .message-content {
  background: #2563eb;
  color: white;
  border-radius: 12px 12px 0 12px;
}
.message.bot .message-content {
  border-radius: 12px 12px 12px 0;
}

.sender {
  font-weight: bold;
  margin-right: 6px;
}
.text {
  white-space: pre-wrap;
}
.msg-image {
  max-width: 220px;
  border-radius: 8px;
  margin-top: 8px;
  display: block;
  border: 1px solid #334155;
}

/* Typing dots */
.typing .text {
  display: flex;
  gap: 4px;
}
.typing-dots span {
  animation: blink 1.4s infinite both;
}
.typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.typing-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes blink {
  0% { opacity: 0.2; }
  20% { opacity: 1; }
  100% { opacity: 0.2; }
}

/* Input */
.chatbot-input {
  display: flex;
  gap: 8px;
  padding: 10px 16px;
  background: #1e293b;
  border-radius: 0 0 16px 16px;
  border-top: 1px solid #334155;
  flex-shrink: 0;
}
.chatbot-input input {
  flex: 1;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid #334155;
  background: #0f172a;
  color: #e2e8f0;
  font-size: 14px;
  outline: none;
  transition: 0.2s;
}
.chatbot-input input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59,130,246,0.2);
}
.chatbot-input input::placeholder {
  color: #64748b;
}
.chatbot-input button {
  padding: 10px 18px;
  border-radius: 12px;
  border: none;
  background: #3b82f6;
  color: white;
  font-size: 18px;
  cursor: pointer;
  transition: 0.2s;
}
.chatbot-input button:hover {
  background: #2563eb;
}
.chatbot-input button:disabled {
  background: #475569;
  cursor: not-allowed;
}
</style>