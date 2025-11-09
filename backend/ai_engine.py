from typing import List, Dict, Any, Tuple
from emergentintegrations.llm.chat import LlmChat, UserMessage
from dotenv import load_dotenv
import os
import json
import re
import uuid

load_dotenv()

EMERGENT_LLM_KEY = os.getenv("EMERGENT_LLM_KEY")
if not EMERGENT_LLM_KEY:
    raise ValueError("EMERGENT_LLM_KEY not found in environment variables")

def parse_structured_response(raw_response: str) -> Dict[str, Any]:
    """
    Parse the structured response from Claude into key topics, concept graph, markdown content, and sources
    """
    key_topics = []
    concept_graph = []
    markdown_content = ""
    sources = []
    
    # Try to extract structured sections
    try:
        # Extract KEY_TOPICS section
        topics_match = re.search(r'KEY_TOPICS:\s*(.*?)\s*(?:CONCEPT_CONNECTIONS:|EXPLANATION:|SOURCES:|$)', raw_response, re.DOTALL | re.IGNORECASE)
        if topics_match:
            topics_text = topics_match.group(1).strip()
            # Extract individual topics (lines starting with -, *, or numbers)
            key_topics = [
                re.sub(r'^[\-\*\d\.]+\s*', '', line.strip()) 
                for line in topics_text.split('\n') 
                if line.strip() and (line.strip().startswith('-') or line.strip().startswith('*') or re.match(r'^\d+\.', line.strip()))
            ]
        
        # Extract CONCEPT_CONNECTIONS section
        connections_match = re.search(r'CONCEPT_CONNECTIONS:\s*(.*?)\s*(?:EXPLANATION:|SOURCES:|$)', raw_response, re.DOTALL | re.IGNORECASE)
        if connections_match:
            connections_text = connections_match.group(1).strip()
            # Parse connections in format: "concept A -> concept B: relationship"
            for line in connections_text.split('\n'):
                line = line.strip()
                if '->' in line:
                    parts = line.split('->')
                    if len(parts) == 2:
                        source = parts[0].strip()
                        rest = parts[1].split(':')
                        target = rest[0].strip()
                        relationship = rest[1].strip() if len(rest) > 1 else "relates to"
                        concept_graph.append({
                            "source": source,
                            "target": target,
                            "relationship": relationship
                        })
        
        # Extract EXPLANATION section (the main content)
        explanation_match = re.search(r'EXPLANATION:\s*(.*?)\s*(?:SOURCES:|$)', raw_response, re.DOTALL | re.IGNORECASE)
        if explanation_match:
            markdown_content = explanation_match.group(1).strip()
        else:
            # If no structured format found, use entire response as markdown
            markdown_content = raw_response
        
        # Extract SOURCES section
        sources_match = re.search(r'SOURCES:\s*(.*?)$', raw_response, re.DOTALL | re.IGNORECASE)
        if sources_match:
            sources_text = sources_match.group(1).strip()
            # Extract individual sources (lines starting with -, *, or numbers)
            sources = [
                re.sub(r'^[\-\*\d\.]+\s*', '', line.strip()) 
                for line in sources_text.split('\n') 
                if line.strip() and (line.strip().startswith('-') or line.strip().startswith('*') or re.match(r'^\d+\.', line.strip()))
            ]
            
    except Exception as e:
        # Fallback: use entire response as markdown
        markdown_content = raw_response
    
    # If parsing failed to extract anything, fallback to entire response
    if not markdown_content:
        markdown_content = raw_response
    
    return {
        "message": raw_response,  # Keep original for backward compatibility
        "key_topics": key_topics,
        "concept_graph": concept_graph,
        "markdown_content": markdown_content,
        "sources": sources
    }

async def generate_teaching_response(
    course: Dict[str, Any],
    materials: List[Dict[str, Any]],
    user_message: str,
    chat_history: List[Dict[str, Any]],
    session_id: str,
    student_major: str = None
) -> Dict[str, Any]:
    """
    Generate an AI teaching response using Claude Sonnet 4
    Personalizes explanations based on student's major
    """
    
    # Build context from course materials
    course_context = f"""Course: {course.get('title', 'Unknown')}
Description: {course.get('description', 'No description')}
"""
    
    if course.get('objectives'):
        course_context += f"\nLearning Objectives:\n"
        for obj in course['objectives']:
            course_context += f"- {obj}\n"
    
    # Add materials context (limited to avoid token limits)
    materials_context = "\n\nCourse Materials (use these titles in SOURCES section):\n"
    material_titles = []
    for material in materials[:5]:  # Limit to first 5 materials
        title = material.get('title', 'Untitled')
        mat_type = material.get('material_type', 'Material').upper()
        material_titles.append(f"{mat_type}: {title}")
        materials_context += f"\n{mat_type}: {title}\n"
        content = material.get('content', '')
        # Limit content length
        if len(content) > 2000:
            content = content[:2000] + "...\n[Content truncated for brevity]"
        materials_context += f"{content}\n"
    
    # Add personalization context if student major is available
    personalization_context = ""
    if student_major:
        personalization_context = f"""
STUDENT PROFILE - PERSONALIZATION REQUIRED:
The student's major is: {student_major}

CRITICAL PERSONALIZATION INSTRUCTIONS:
- Tailor ALL explanations, examples, and analogies to be relevant to {student_major}
- Use terminology and contexts familiar to {student_major} students
- When explaining concepts, draw parallels to topics in {student_major}
- Example: If explaining "supply and demand":
  * For Business students: use market dynamics, pricing strategies, consumer behavior
  * For Biology students: use ecosystem dynamics, predator-prey relationships, resource competition
  * For Computer Science students: use API rate limiting, server load balancing, resource allocation
- Make the student feel the explanation was crafted specifically for their field of study
"""

    # Build system message
    system_message = f"""You are Brillia, an AI teaching assistant designed to help students truly understand concepts, not just answer questions.

Your teaching philosophy:
1. Guide students to discover answers through Socratic questioning
2. Adapt explanations based on the student's understanding level
3. Provide multiple perspectives: analogies, visual descriptions, real-world examples
4. If a student says "I don't understand," probe deeper and explain in a different way
5. Connect new concepts to what they already know
6. Encourage critical thinking rather than memorization
7. Be patient, encouraging, and supportive
8. Break down complex topics into digestible pieces
{personalization_context}

{course_context}
{materials_context}

CRITICAL: You MUST structure your response in the following EXACT format. This is non-negotiable:

KEY_TOPICS:
- Topic 1
- Topic 2
- Topic 3
- Topic 4
- Topic 5

CONCEPT_CONNECTIONS:
Concept A -> Concept B: How A relates to B
Concept C -> Concept D: How C relates to D
Concept E -> Concept F: How E relates to F

EXPLANATION:
[Your detailed markdown-formatted explanation here. Use markdown formatting like **bold**, *italic*, headers (#, ##, ###), bullet points, code blocks, etc.]

SOURCES:
- Material Title 1: Brief description of what information was used
- Material Title 2: Brief description of what information was used

YOU MUST INCLUDE ALL FOUR SECTIONS (KEY_TOPICS, CONCEPT_CONNECTIONS, EXPLANATION, SOURCES) IN EVERY RESPONSE.

When answering:
- Always ground your responses in the course materials provided
- ALWAYS cite which course materials you used in the SOURCES section
- If the question is outside the course scope, gently redirect to course topics
- Ask follow-up questions to assess understanding
- Provide depth appropriate to the student's current level
- Use rich markdown formatting (headers, lists, bold, italic, code blocks) to make explanations clear
- If you detect confusion, offer alternative explanations or analogies
- Identify 3-5 key topics covered in your response
- Show relationships between concepts as connections
- Reference specific materials (lecture notes, syllabus, assignments) you drew information from
"""
    
    # Initialize chat with Claude Sonnet 4
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=system_message
    ).with_model("anthropic", "claude-3-7-sonnet-20250219")
    
    # Create user message
    message = UserMessage(text=user_message)
    
    # Get response
    response = await chat.send_message(message)
    
    # Parse the structured response
    parsed_response = parse_structured_response(response)
    
    return parsed_response


async def generate_quiz(
    course: Dict[str, Any],
    materials: List[Dict[str, Any]],
    topic: str = None,
    num_questions: int = 5
) -> List[Dict[str, Any]]:
    """
    Generate quiz questions based on course materials
    """
    
    # Build context from course materials
    materials_context = "Course Materials:\n"
    for material in materials[:5]:
        materials_context += f"\n{material.get('material_type', 'Material').upper()}: {material.get('title', 'Untitled')}\n"
        content = material.get('content', '')
        if len(content) > 2000:
            content = content[:2000] + "..."
        materials_context += f"{content}\n"
    
    topic_instruction = f"Focus specifically on: {topic}" if topic else "Cover various topics from the course materials"
    
    system_message = f"""You are Brillia, an AI teaching assistant creating quiz questions to test student understanding.

Course: {course.get('title', 'Unknown')}
{materials_context}

Create {num_questions} multiple-choice quiz questions that:
1. {topic_instruction}
2. Test understanding, not just memorization
3. Are based directly on the course materials provided
4. Have 4 options each with only ONE correct answer
5. Include a clear explanation of why the answer is correct

FORMAT YOUR RESPONSE AS JSON:
{{
  "questions": [
    {{
      "question": "Clear, specific question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": 0,
      "explanation": "Detailed explanation of why this answer is correct and why others are wrong",
      "topic": "Specific topic this question tests"
    }}
  ]
}}

CRITICAL: Return ONLY valid JSON, no other text."""
    
    # Initialize chat with Claude Sonnet 4
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=str(uuid.uuid4()),
        system_message=system_message
    ).with_model("anthropic", "claude-3-7-sonnet-20250219")
    
    # Create message
    message = UserMessage(text=f"Generate {num_questions} quiz questions following the format specified.")
    
    # Get response
    response = await chat.send_message(message)
    
    try:
        # Parse JSON response
        # Remove markdown code blocks if present
        response_text = response.strip()
        if response_text.startswith('```'):
            response_text = re.sub(r'^```json\s*', '', response_text)
            response_text = re.sub(r'```\s*$', '', response_text)
        
        quiz_data = json.loads(response_text)
        return quiz_data.get('questions', [])
    except json.JSONDecodeError as e:
        print(f"Error parsing quiz JSON: {e}")
        print(f"Response: {response}")
        # Return empty list if parsing fails
        return []


async def generate_content_summary(concept: str, materials: List[Dict[str, Any]]) -> str:
    """
    Generate a concise summary of a concept from course materials
    """
    # Extract relevant content from materials
    relevant_content = []
    for material in materials:
        content = material.get("content", "")
        # Simple relevance check
        if concept.lower() in content.lower():
            relevant_content.append(content[:500])  # First 500 chars
    
    context = "\n\n".join(relevant_content[:3]) if relevant_content else "No specific materials found."
    
    system_prompt = """You are an educational assistant helping students review concepts. 
    Create a concise, clear summary (3-4 sentences) of the given concept that a student can quickly read to refresh their understanding.
    Focus on the key ideas and why this concept matters."""
    
    user_prompt = f"""Concept: {concept}

Relevant course materials:
{context}

Create a brief, engaging summary that helps a student review this concept. Keep it to 3-4 sentences maximum."""
    
    try:
        client = LlmChat(api_key=EMERGENT_LLM_KEY, model="claude-sonnet-4-20250514")
        response = client.send_message(
            user_message=UserMessage(content=user_prompt),
            system_message=system_prompt
        )
        return response.strip()
    except Exception as e:
        print(f"Error generating summary: {e}")
        return f"Review the concept of {concept}. Focus on understanding the fundamentals and how it connects to other topics in the course."


async def generate_quick_quiz(concept: str, materials: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Generate a single quick quiz question for a concept
    """
    # Extract relevant content
    relevant_content = []
    for material in materials:
        content = material.get("content", "")
        if concept.lower() in content.lower():
            relevant_content.append(content[:500])
    
    context = "\n\n".join(relevant_content[:3]) if relevant_content else "General knowledge."
    
    system_prompt = """You are an educational quiz generator. Create a single, clear multiple-choice question 
    to test understanding of a concept. The question should be at an appropriate difficulty level for review."""
    
    user_prompt = f"""Concept: {concept}

Course context:
{context}

Generate ONE multiple-choice question in this exact JSON format:
{{
    "question": "Your question here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": 0,
    "explanation": "Brief explanation of why this is correct"
}}

Make the question clear and the options plausible."""
    
    try:
        client = LlmChat(api_key=EMERGENT_LLM_KEY, model="claude-sonnet-4-20250514")
        response = client.send_message(
            user_message=UserMessage(content=user_prompt),
            system_message=system_prompt
        )
        
        # Parse JSON response
        response_text = response.strip()
        if response_text.startswith('```'):
            response_text = re.sub(r'^```json\s*', '', response_text)
            response_text = re.sub(r'```\s*$', '', response_text)
        
        quiz_data = json.loads(response_text)
        return quiz_data
    except Exception as e:
        print(f"Error generating quick quiz: {e}")
        return {
            "question": f"What is a key characteristic of {concept}?",
            "options": [
                "It is fundamental to understanding the topic",
                "It is rarely used in practice",
                "It is only theoretical",
                "It has no practical applications"
            ],
            "correct_answer": 0,
            "explanation": f"Understanding {concept} is crucial for mastering this subject."
        }

