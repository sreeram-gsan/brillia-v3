"""
AI-powered intent detection for student messages
Detects quiz requests and extracts specific topics
"""
from emergentintegrations.llm.chat import LlmChat, UserMessage
from dotenv import load_dotenv
import os
import json
import re

load_dotenv()
EMERGENT_LLM_KEY = os.getenv("EMERGENT_LLM_KEY")

async def detect_quiz_intent(message: str) -> dict:
    """
    Use AI to detect if student is asking for a quiz and extract the topic
    
    Returns:
    {
        "is_quiz_request": bool,
        "topic": str or None,
        "confidence": float (0-1)
    }
    """
    
    system_message = """You are an intent classifier for an educational AI assistant.

Your task: Analyze student messages and determine if they are asking to be quizzed/tested.

QUIZ REQUEST INDICATORS:
- Explicit: "quiz me", "test me", "give me a quiz", "I want to take a quiz"
- Implicit: "can you assess my understanding", "I want to practice", "check if I know"

NOT QUIZ REQUESTS:
- Technical questions: "what is test data", "explain testing", "difference between X and Y"
- Clarification: "can you explain", "what does X mean", "how does Y work"
- General chat: "hello", "thanks", "I don't understand"

If it IS a quiz request, extract the SPECIFIC TOPIC if mentioned:
- "quiz me on supervised learning" → topic: "supervised learning"
- "test me on algorithms" → topic: "algorithms"  
- "quiz me" → topic: null (general quiz)

Return ONLY valid JSON:
{
  "is_quiz_request": true/false,
  "topic": "specific topic" or null,
  "confidence": 0.0-1.0
}"""

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id="intent-detection",
            system_message=system_message
        ).with_model("anthropic", "claude-3-7-sonnet-20250219")
        
        prompt = f"Analyze this student message: \"{message}\""
        response = await chat.send_message(UserMessage(text=prompt))
        
        # Parse JSON response
        response_text = response.strip()
        if response_text.startswith('```'):
            response_text = re.sub(r'^```json\s*', '', response_text)
            response_text = re.sub(r'```\s*$', '', response_text)
        
        result = json.loads(response_text)
        
        # Validate structure
        if not isinstance(result, dict):
            return {"is_quiz_request": False, "topic": None, "confidence": 0.0}
        
        return {
            "is_quiz_request": result.get("is_quiz_request", False),
            "topic": result.get("topic"),
            "confidence": result.get("confidence", 0.5)
        }
        
    except Exception as e:
        print(f"Error in intent detection: {e}")
        # Fallback to simple keyword detection
        message_lower = message.lower()
        if any(phrase in message_lower for phrase in ["quiz me", "test me", "give me a quiz"]):
            return {"is_quiz_request": True, "topic": None, "confidence": 0.7}
        return {"is_quiz_request": False, "topic": None, "confidence": 0.0}


async def filter_materials_by_topic(materials: list, topic: str) -> list:
    """
    Filter course materials to only include content relevant to the specified topic
    """
    if not topic:
        return materials
    
    system_message = """You are a content relevance analyzer for educational materials.

Your task: Determine if course material content is relevant to a specific topic.

Respond with ONLY "YES" or "NO" for each material."""

    try:
        relevant_materials = []
        
        for material in materials[:10]:  # Limit to avoid token limits
            content = material.get('content', '')[:1000]  # First 1000 chars
            title = material.get('title', '')
            
            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id="relevance-check",
                system_message=system_message
            ).with_model("anthropic", "claude-3-7-sonnet-20250219")
            
            prompt = f"""Topic: "{topic}"

Material Title: "{title}"
Material Content: "{content}..."

Is this material relevant to the topic? Answer ONLY "YES" or "NO"."""
            
            response = await chat.send_message(UserMessage(text=prompt))
            
            if "YES" in response.upper():
                relevant_materials.append(material)
        
        # If no materials match, return all (better than nothing)
        return relevant_materials if relevant_materials else materials[:5]
        
    except Exception as e:
        print(f"Error filtering materials: {e}")
        return materials[:5]
