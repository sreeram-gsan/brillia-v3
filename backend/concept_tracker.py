"""
Concept Mastery Tracking System
Extracts concepts from course materials and tracks student mastery
"""
from typing import List, Dict, Any
from database import get_database
from datetime import datetime
import re
from collections import Counter

async def extract_concepts_from_materials(materials: List[Dict[str, Any]]) -> List[str]:
    """
    Extract meaningful domain-specific concepts from course materials using AI
    """
    # Combine all material content
    all_text = ""
    for material in materials[:10]:  # Limit to avoid token limits
        content = material.get('content', '')[:1500]  # First 1500 chars per material
        title = material.get('title', '')
        all_text += f"\n{title}\n{content}\n"
    
    # Use AI to extract meaningful concepts
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    from dotenv import load_dotenv
    import os
    
    load_dotenv()
    EMERGENT_LLM_KEY = os.getenv("EMERGENT_LLM_KEY")
    
    system_message = """You are a concept extractor for educational content.

Extract 10-15 KEY CONCEPTS from the course materials provided.

GOOD CONCEPTS (domain-specific, meaningful):
- "Machine Learning", "Supervised Learning", "Neural Networks"
- "Binary Search Tree", "Hash Table", "Linked List"
- "Gradient Descent", "Backpropagation", "Overfitting"
- "Object-Oriented Programming", "Inheritance", "Polymorphism"

BAD CONCEPTS (too generic, not useful):
- "Data", "Training", "Testing", "What", "How", "Course"
- "Introduction", "Overview", "Example", "Chapter"
- "Student", "Professor", "Learning", "Understanding"

Focus on:
- Technical terms and methodologies
- Specific algorithms, data structures, or techniques
- Domain-specific vocabulary
- Multi-word concepts (2-4 words)

Return ONLY a JSON array of concepts:
["Concept 1", "Concept 2", "Concept 3", ...]"""

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id="concept-extraction",
            system_message=system_message
        ).with_model("anthropic", "claude-3-7-sonnet-20250219")
        
        prompt = f"""Course Materials:
{all_text[:4000]}

Extract the key technical concepts from these materials. Return as JSON array."""
        
        response = await chat.send_message(UserMessage(text=prompt))
        
        # Parse JSON response
        response_text = response.strip()
        if response_text.startswith('```'):
            response_text = re.sub(r'^```json\s*', '', response_text)
            response_text = re.sub(r'```\s*$', '', response_text)
        
        import json
        concepts = json.loads(response_text)
        
        # Validate and clean
        if isinstance(concepts, list):
            # Filter out any remaining generic terms
            stop_words = {'data', 'training', 'testing', 'what', 'how', 'course', 'introduction', 
                         'overview', 'example', 'chapter', 'student', 'professor', 'learning', 
                         'understanding', 'information', 'system', 'process', 'method', 'approach',
                         'concept', 'topic', 'subject', 'material', 'content'}
            
            filtered_concepts = [
                c for c in concepts 
                if isinstance(c, str) and 
                len(c) > 3 and 
                c.lower() not in stop_words and
                not any(word in c.lower().split() for word in stop_words if len(word) < 8)
            ]
            
            return filtered_concepts[:15]
        
    except Exception as e:
        print(f"Error in AI concept extraction: {e}")
        # Fallback to improved regex-based extraction
        
    # Fallback: Extract multi-word capitalized terms and technical keywords
    # Extract 2-4 word capitalized phrases
    multi_word = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}\b', all_text)
    
    # Domain-specific technical term patterns
    technical_patterns = [
        r'\b(?:algorithm|data structure|neural network|machine learning|deep learning)\b',
        r'\b(?:supervised|unsupervised|reinforcement)\s+learning\b',
        r'\b(?:binary|linear|hash|merge|quick)\s+(?:search|sort|tree|table)\b',
        r'\b(?:linked|doubly)\s+list\b',
        r'\b(?:gradient|stochastic)\s+descent\b',
        r'\b(?:time|space)\s+complexity\b',
        r'\b(?:object|functional|procedural)\s+programming\b',
    ]
    
    technical_terms = []
    for pattern in technical_patterns:
        matches = re.findall(pattern, all_text, re.IGNORECASE)
        technical_terms.extend([m.title() for m in matches])
    
    # Combine and count
    all_terms = multi_word + technical_terms
    term_counts = Counter(all_terms)
    
    # Filter
    stop_words = {'Data', 'Training', 'Testing', 'What', 'How', 'Course', 'Introduction', 
                  'Overview', 'Example', 'Chapter', 'The', 'This', 'That', 'With', 'From'}
    
    concepts = [
        term for term, count in term_counts.most_common(25) 
        if count >= 2 and term not in stop_words and len(term) > 5
    ]
    
    return concepts[:15]


async def update_concept_mastery(
    student_id: str,
    course_id: str,
    concept: str,
    interaction_type: str,  # 'question', 'quiz_correct', 'quiz_incorrect'
    weight: float = 1.0
):
    """
    Update student's mastery score for a concept (with validation)
    """
    # Validate concept before storing
    STOPWORDS = {
        'what', 'how', 'why', 'when', 'where', 'data', 'training', 'testing', 'test',
        'course', 'introduction', 'overview', 'student', 'learning', 'understanding',
        'concept', 'topic', 'material', 'process', 'method', 'system', 'the', 'and'
    }
    
    concept_lower = concept.lower()
    concept_words = concept_lower.split()
    
    # Don't store if concept is invalid
    if (concept_lower in STOPWORDS or 
        len(concept) < 4 or 
        (len(concept_words) == 1 and len(concept) < 5) or
        all(word in STOPWORDS for word in concept_words)):
        return  # Skip storing this concept
    
    db = get_database()
    
    # Find or create mastery record
    mastery_record = await db.concept_mastery.find_one({
        "student_id": student_id,
        "course_id": course_id,
        "concept": concept
    })
    
    if not mastery_record:
        mastery_record = {
            "id": str(uuid.uuid4()),
            "course_id": course_id,
            "student_id": student_id,
            "concept": concept,
            "mastery_score": 0,
            "interactions": 0,
            "correct_answers": 0,
            "total_questions": 0,
            "last_interaction": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
    
    # Update based on interaction type
    mastery_record["interactions"] += 1
    mastery_record["last_interaction"] = datetime.utcnow().isoformat()
    mastery_record["updated_at"] = datetime.utcnow().isoformat()
    
    if interaction_type == 'question':
        # Each question adds small amount to mastery (exploration)
        mastery_record["mastery_score"] = min(100, mastery_record["mastery_score"] + (3 * weight))
    
    elif interaction_type == 'quiz_correct':
        mastery_record["correct_answers"] += 1
        mastery_record["total_questions"] += 1
    
    elif interaction_type == 'quiz_incorrect':
        mastery_record["total_questions"] += 1
    
    # Calculate mastery score based on quiz performance and interactions
    # Requires multiple data points for high confidence scores
    if mastery_record["total_questions"] > 0:
        # Quiz accuracy percentage
        quiz_accuracy = (mastery_record["correct_answers"] / mastery_record["total_questions"]) * 100
        
        # Confidence factor: lower confidence with fewer questions
        # 1-2 questions = 0.4x, 3-4 questions = 0.6x, 5-6 questions = 0.8x, 7+ questions = 1.0x
        if mastery_record["total_questions"] <= 2:
            confidence_factor = 0.4
        elif mastery_record["total_questions"] <= 4:
            confidence_factor = 0.6
        elif mastery_record["total_questions"] <= 6:
            confidence_factor = 0.8
        else:
            confidence_factor = 1.0
        
        # Apply confidence factor to quiz accuracy
        adjusted_quiz_score = quiz_accuracy * confidence_factor
        
        # Small interaction bonus (max 15%)
        interaction_bonus = min(15, mastery_record["interactions"] * 1.5)
        
        # Final score: adjusted quiz + interaction bonus
        mastery_record["mastery_score"] = min(100, adjusted_quiz_score + interaction_bonus)
    else:
        # No quiz data yet, score based only on interactions (questions asked)
        # Each interaction gives 3 points, capped at 30% without quiz validation
        interaction_score = min(30, mastery_record["interactions"] * 3)
        mastery_record["mastery_score"] = interaction_score
    
    # Upsert the record
    await db.concept_mastery.update_one(
        {"student_id": student_id, "course_id": course_id, "concept": concept},
        {"$set": mastery_record},
        upsert=True
    )


async def detect_concepts_in_text(text: str, course_concepts: List[str]) -> List[str]:
    """
    Detect which concepts are mentioned in a text (question, answer, etc.)
    Uses fuzzy matching for better detection of multi-word concepts
    """
    text_lower = text.lower()
    detected = []
    
    for concept in course_concepts:
        concept_lower = concept.lower()
        
        # Exact match (best case)
        if concept_lower in text_lower:
            detected.append(concept)
            continue
        
        # For multi-word concepts, check if most significant words appear
        if ' ' in concept_lower:
            words = concept_lower.split()
            # Filter out common words
            significant_words = [w for w in words if len(w) > 3 and w not in {'the', 'and', 'for', 'with'}]
            
            # If at least 60% of significant words appear, consider it a match
            if significant_words:
                matches = sum(1 for w in significant_words if w in text_lower)
                if matches / len(significant_words) >= 0.6:
                    detected.append(concept)
        else:
            # Single word concepts - check for word boundaries
            if re.search(rf'\b{re.escape(concept_lower)}\b', text_lower):
                detected.append(concept)
    
    return detected


async def get_course_concept_mastery(course_id: str) -> Dict[str, Any]:
    """
    Get aggregated concept mastery data for a course with aggressive filtering
    """
    db = get_database()
    
    # Comprehensive stopword list for filtering out useless concepts
    STOPWORDS = {
        # Generic words
        'what', 'how', 'why', 'when', 'where', 'who', 'which', 'that', 'this', 'these', 'those',
        # Common words
        'data', 'training', 'testing', 'test', 'train', 'information', 'knowledge',
        # Course/learning terms
        'course', 'lesson', 'lecture', 'chapter', 'section', 'module', 'unit',
        'introduction', 'overview', 'summary', 'conclusion', 'example', 'examples',
        'student', 'students', 'professor', 'teacher', 'learning', 'study', 'studying',
        # Generic verbs
        'understanding', 'explain', 'explaining', 'understand', 'learn', 'teach', 'know',
        # Generic concepts
        'concept', 'concepts', 'topic', 'topics', 'subject', 'subjects', 
        'material', 'materials', 'content', 'contents',
        # Process words
        'process', 'processes', 'method', 'methods', 'approach', 'approaches',
        'technique', 'techniques', 'strategy', 'strategies',
        # System words
        'system', 'systems', 'model', 'models', 'framework', 'frameworks',
        # Generic adjectives
        'basic', 'advanced', 'simple', 'complex', 'important', 'key', 'main',
        # Articles and prepositions
        'the', 'and', 'for', 'with', 'from', 'about', 'into', 'through',
        # Others
        'different', 'various', 'several', 'many', 'some', 'all', 'each'
    }
    
    # Get all mastery records for this course
    mastery_records = await db.concept_mastery.find({"course_id": course_id}).to_list(1000)
    
    if not mastery_records:
        return {"total_concepts": 0, "total_students": 0, "heatmap_data": []}
    
    # Aggregate by concept with filtering
    concept_data = {}
    students = set()
    
    for record in mastery_records:
        concept = record["concept"]
        student_id = record["student_id"]
        students.add(student_id)
        
        # AGGRESSIVE FILTERING: Skip if concept matches stopwords
        concept_lower = concept.lower()
        concept_words = concept_lower.split()
        
        # Skip if:
        # 1. Entire concept is a stopword
        if concept_lower in STOPWORDS:
            continue
        
        # 2. Single word and less than 5 characters (likely not meaningful)
        if len(concept_words) == 1 and len(concept) < 5:
            continue
        
        # 3. All words are stopwords
        if all(word in STOPWORDS for word in concept_words):
            continue
        
        # 4. First word is a question word or generic term
        if concept_words[0] in {'what', 'how', 'why', 'when', 'where', 'the', 'a', 'an'}:
            continue
        
        # 5. Contains only generic/common words (more than 70% are stopwords)
        if len(concept_words) > 1:
            stopword_ratio = sum(1 for w in concept_words if w in STOPWORDS) / len(concept_words)
            if stopword_ratio > 0.7:
                continue
        
        # 6. Too short (less than 4 characters total)
        if len(concept.replace(' ', '')) < 4:
            continue
        
        if concept not in concept_data:
            concept_data[concept] = {
                "concept": concept,
                "avg_mastery": 0,
                "total_interactions": 0,
                "student_count": 0,
                "student_masteries": []
            }
        
        concept_data[concept]["student_masteries"].append(record["mastery_score"])
        concept_data[concept]["total_interactions"] += record["interactions"]
        concept_data[concept]["student_count"] += 1
    
    # Calculate averages
    for concept, data in concept_data.items():
        if data["student_masteries"]:
            data["avg_mastery"] = sum(data["student_masteries"]) / len(data["student_masteries"])
    
    # Format for heatmap
    heatmap_data = [
        {
            "concept": concept,
            "mastery": round(data["avg_mastery"], 1),
            "interactions": data["total_interactions"],
            "students": data["student_count"]
        }
        for concept, data in concept_data.items()
    ]
    
    # Sort by mastery score
    heatmap_data.sort(key=lambda x: x["mastery"], reverse=True)
    
    return {
        "total_concepts": len(heatmap_data),
        "total_students": len(students),
        "heatmap_data": heatmap_data
    }


# Import uuid
import uuid
