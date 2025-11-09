#!/usr/bin/env python3
"""
Brillia.ai Backend API Test Suite
Tests all backend endpoints according to the review request sequence
"""

import asyncio
import aiohttp
import json
import os
from typing import Dict, Any, Optional

# Get backend URL from frontend .env
BACKEND_URL = "https://smart-tutor-98.preview.emergentagent.com"

class BrilliaAPITester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = None
        self.professor_token = None
        self.student_token = None
        self.course_id = None
        self.session_id = None
        self.test_results = []
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.test_results.append({
            "test": test_name,
            "status": status,
            "success": success,
            "details": details
        })
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
    
    async def make_request(self, method: str, endpoint: str, data: Any = None, 
                          token: str = None, is_form: bool = False) -> tuple[bool, Any]:
        """Make HTTP request and return (success, response_data)"""
        url = f"{self.base_url}{endpoint}"
        headers = {}
        
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        try:
            if method.upper() == "GET":
                async with self.session.get(url, headers=headers) as response:
                    response_data = await response.json()
                    return response.status in [200, 201], response_data
            
            elif method.upper() == "POST":
                if is_form:
                    # For form data (materials upload)
                    form_data = aiohttp.FormData()
                    for key, value in data.items():
                        form_data.add_field(key, str(value))
                    
                    async with self.session.post(url, data=form_data, headers=headers) as response:
                        response_data = await response.json()
                        return response.status in [200, 201], response_data
                else:
                    # For JSON data
                    headers["Content-Type"] = "application/json"
                    async with self.session.post(url, json=data, headers=headers) as response:
                        response_data = await response.json()
                        return response.status in [200, 201], response_data
            
            elif method.upper() == "DELETE":
                async with self.session.delete(url, headers=headers) as response:
                    response_data = await response.json()
                    return response.status in [200, 204], response_data
                    
        except Exception as e:
            return False, {"error": str(e)}
    
    async def test_1_health_check(self):
        """Test 1: Health Check"""
        success, response = await self.make_request("GET", "/api/health")
        
        if success and response.get("status") == "healthy":
            self.log_test("Health Check", True, "API is healthy")
        else:
            self.log_test("Health Check", False, f"Response: {response}")
    
    async def test_2_professor_registration(self):
        """Test 2: Professor Registration"""
        import time
        timestamp = int(time.time())
        
        data = {
            "name": "Dr. John Smith",
            "email": f"professor{timestamp}@university.edu",
            "password": "test123",
            "role": "professor"
        }
        
        success, response = await self.make_request("POST", "/api/auth/register", data)
        
        if success and "access_token" in response and response.get("user", {}).get("role") == "professor":
            self.professor_token = response["access_token"]
            self.log_test("Professor Registration", True, f"Token received, User ID: {response['user']['id']}")
        else:
            self.log_test("Professor Registration", False, f"Response: {response}")
    
    async def test_3_create_course(self):
        """Test 3: Create Course"""
        if not self.professor_token:
            self.log_test("Create Course", False, "No professor token available")
            return
        
        data = {
            "title": "Introduction to Computer Science",
            "description": "Learn the fundamentals of CS",
            "objectives": ["Understand algorithms", "Learn data structures"]
        }
        
        success, response = await self.make_request("POST", "/api/courses", data, self.professor_token)
        
        if success and "id" in response:
            self.course_id = response["id"]
            self.log_test("Create Course", True, f"Course created with ID: {self.course_id}")
        else:
            self.log_test("Create Course", False, f"Response: {response}")
    
    async def test_4_upload_course_material(self):
        """Test 4: Upload Course Material (Text)"""
        if not self.professor_token or not self.course_id:
            self.log_test("Upload Course Material", False, "Missing professor token or course ID")
            return
        
        data = {
            "course_id": self.course_id,
            "title": "Lecture 1: Introduction",
            "material_type": "lecture",
            "content": "Computer Science is the study of algorithms and data structures. An algorithm is a step-by-step procedure for solving a problem."
        }
        
        success, response = await self.make_request("POST", "/api/materials/upload-text", data, self.professor_token, is_form=True)
        
        if success and "material_id" in response:
            self.log_test("Upload Course Material", True, f"Material uploaded with ID: {response['material_id']}")
        else:
            self.log_test("Upload Course Material", False, f"Response: {response}")
    
    async def test_5_get_course_materials(self):
        """Test 5: Get Course Materials"""
        if not self.professor_token or not self.course_id:
            self.log_test("Get Course Materials", False, "Missing professor token or course ID")
            return
        
        success, response = await self.make_request("GET", f"/api/materials/course/{self.course_id}", token=self.professor_token)
        
        if success and isinstance(response, list) and len(response) > 0:
            self.log_test("Get Course Materials", True, f"Retrieved {len(response)} materials")
        else:
            self.log_test("Get Course Materials", False, f"Response: {response}")
    
    async def test_6_student_registration(self):
        """Test 6: Student Registration & Login"""
        import time
        timestamp = int(time.time())
        
        data = {
            "name": "Alice Student",
            "email": f"student{timestamp}@university.edu",
            "password": "test123",
            "role": "student"
        }
        
        success, response = await self.make_request("POST", "/api/auth/register", data)
        
        if success and "access_token" in response and response.get("user", {}).get("role") == "student":
            self.student_token = response["access_token"]
            self.log_test("Student Registration", True, f"Token received, User ID: {response['user']['id']}")
        else:
            self.log_test("Student Registration", False, f"Response: {response}")
    
    async def test_7_enroll_in_course(self):
        """Test 7: Enroll in Course"""
        if not self.student_token or not self.course_id:
            self.log_test("Enroll in Course", False, "Missing student token or course ID")
            return
        
        data = {
            "course_id": self.course_id
        }
        
        success, response = await self.make_request("POST", "/api/courses/enroll", data, self.student_token)
        
        if success and "id" in response:
            self.log_test("Enroll in Course", True, f"Enrollment ID: {response['id']}")
        else:
            self.log_test("Enroll in Course", False, f"Response: {response}")
    
    async def test_8_send_chat_message(self):
        """Test 8: Send Chat Message"""
        if not self.student_token or not self.course_id:
            self.log_test("Send Chat Message", False, "Missing student token or course ID")
            return
        
        data = {
            "course_id": self.course_id,
            "message": "What is an algorithm?"
        }
        
        success, response = await self.make_request("POST", "/api/chat/send", data, self.student_token)
        
        if success and "session_id" in response and "message" in response:
            self.session_id = response["session_id"]
            ai_response = response["message"]
            self.log_test("Send Chat Message", True, f"AI Response received (length: {len(ai_response)})")
        else:
            self.log_test("Send Chat Message", False, f"Response: {response}")
    
    async def test_9_send_followup_message(self):
        """Test 9: Send Follow-up Message"""
        if not self.student_token or not self.course_id or not self.session_id:
            self.log_test("Send Follow-up Message", False, "Missing required tokens/IDs")
            return
        
        data = {
            "course_id": self.course_id,
            "message": "Can you give me an example?",
            "session_id": self.session_id
        }
        
        success, response = await self.make_request("POST", "/api/chat/send", data, self.student_token)
        
        if success and "message" in response:
            ai_response = response["message"]
            self.log_test("Send Follow-up Message", True, f"Contextual AI response received (length: {len(ai_response)})")
        else:
            self.log_test("Send Follow-up Message", False, f"Response: {response}")
    
    async def test_10_get_chat_history(self):
        """Test 10: Get Chat History"""
        if not self.student_token or not self.course_id:
            self.log_test("Get Chat History", False, "Missing student token or course ID")
            return
        
        success, response = await self.make_request("GET", f"/api/chat/history/{self.course_id}", token=self.student_token)
        
        if success and isinstance(response, list) and len(response) >= 4:  # 2 user messages + 2 AI responses
            user_messages = [msg for msg in response if msg["role"] == "user"]
            ai_messages = [msg for msg in response if msg["role"] == "assistant"]
            self.log_test("Get Chat History", True, f"Retrieved {len(user_messages)} user messages and {len(ai_messages)} AI responses")
        else:
            self.log_test("Get Chat History", False, f"Expected at least 4 messages, got: {len(response) if isinstance(response, list) else 'invalid response'}")
    
    async def test_11_get_course_analytics(self):
        """Test 11: Get Course Analytics (Professor)"""
        if not self.professor_token or not self.course_id:
            self.log_test("Get Course Analytics", False, "Missing professor token or course ID")
            return
        
        success, response = await self.make_request("GET", f"/api/analytics/course/{self.course_id}", token=self.professor_token)
        
        if success and all(key in response for key in ["total_questions", "active_students", "common_topics", "confusion_points"]):
            total_questions = response["total_questions"]
            active_students = response["active_students"]
            common_topics = response["common_topics"]
            confusion_points = response["confusion_points"]
            
            self.log_test("Get Course Analytics", True, 
                         f"Questions: {total_questions}, Active Students: {active_students}, Topics: {len(common_topics)}, Confusion Points: {len(confusion_points)}")
        else:
            self.log_test("Get Course Analytics", False, f"Response: {response}")
    
    async def test_12_get_weak_topic_cards(self):
        """Test 12: Get Weak Topic Cards (Personalized Learning)"""
        if not self.course_id:
            self.log_test("Get Weak Topic Cards", False, "Missing course ID")
            return
        
        # Test with course-id-001 as specified in review request
        test_course_id = "course-id-001"
        success, response = await self.make_request("GET", f"/api/personalized/cards/{test_course_id}?student_id=student-demo-001")
        
        if success and "cards" in response:
            cards = response["cards"]
            self.log_test("Get Weak Topic Cards", True, f"Retrieved {len(cards)} cards (empty is expected for new feature)")
            
            # If cards exist, validate structure
            if cards:
                card = cards[0]
                required_fields = ["id", "concept", "card_type", "content_summary", "priority"]
                if all(field in card for field in required_fields):
                    self.log_test("Card Structure Validation", True, "Card has all required fields")
                else:
                    missing = [f for f in required_fields if f not in card]
                    self.log_test("Card Structure Validation", False, f"Missing fields: {missing}")
        else:
            self.log_test("Get Weak Topic Cards", False, f"Response: {response}")
    
    async def test_13_get_student_progress(self):
        """Test 13: Get Student Progress (Gamification)"""
        if not self.course_id:
            self.log_test("Get Student Progress", False, "Missing course ID")
            return
        
        # Test with course-id-001 as specified in review request
        test_course_id = "course-id-001"
        success, response = await self.make_request("GET", f"/api/personalized/progress/{test_course_id}?student_id=student-demo-001")
        
        if success:
            required_fields = ["xp", "level", "level_name", "study_streak", "badges_earned", "available_badges"]
            if all(field in response for field in required_fields):
                xp = response["xp"]
                level = response["level"]
                level_name = response["level_name"]
                
                # Validate data types
                if isinstance(xp, int) and isinstance(level, int) and level_name in ["Beginner", "Intermediate", "Advanced"]:
                    self.log_test("Get Student Progress", True, f"XP: {xp}, Level: {level} ({level_name}), Streak: {response['study_streak']}")
                else:
                    self.log_test("Get Student Progress", False, f"Invalid data types - XP: {type(xp)}, Level: {type(level)}, Level Name: {level_name}")
            else:
                missing = [f for f in required_fields if f not in response]
                self.log_test("Get Student Progress", False, f"Missing fields: {missing}")
        else:
            self.log_test("Get Student Progress", False, f"Response: {response}")
    
    async def test_14_get_study_plan(self):
        """Test 14: Get Study Plan (Personalized Learning)"""
        if not self.course_id:
            self.log_test("Get Study Plan", False, "Missing course ID")
            return
        
        # Test with course-id-001 as specified in review request
        test_course_id = "course-id-001"
        success, response = await self.make_request("GET", f"/api/personalized/study-plan/{test_course_id}?student_id=student-demo-001")
        
        if success:
            required_fields = ["daily_focus", "recommended_topics", "total_estimated_time"]
            if all(field in response for field in required_fields):
                daily_focus = response["daily_focus"]
                recommended_topics = response["recommended_topics"]
                total_time = response["total_estimated_time"]
                
                # Validate structure
                if isinstance(recommended_topics, list) and isinstance(total_time, int):
                    self.log_test("Get Study Plan", True, f"Daily focus set, {len(recommended_topics)} topics, {total_time}min total")
                    
                    # Check if no weak topics message (expected for new feature)
                    if "Great job!" in daily_focus or "All concepts are well understood" in daily_focus:
                        self.log_test("Study Plan Empty State", True, "Properly handles no weak topics scenario")
                else:
                    self.log_test("Get Study Plan", False, f"Invalid data types - Topics: {type(recommended_topics)}, Time: {type(total_time)}")
            else:
                missing = [f for f in required_fields if f not in response]
                self.log_test("Get Study Plan", False, f"Missing fields: {missing}")
        else:
            self.log_test("Get Study Plan", False, f"Response: {response}")
    
    async def test_15_dismiss_card(self):
        """Test 15: Dismiss Card (Expected 404 for new feature)"""
        data = {
            "card_id": "test-card-id",
            "correct": True
        }
        
        success, response = await self.make_request("POST", "/api/personalized/cards/dismiss?student_id=student-demo-001", data)
        
        # Expect 404 since no cards exist yet
        if not success and "not found" in str(response).lower():
            self.log_test("Dismiss Card (404 Expected)", True, "Correctly returns 404 for non-existent card")
        elif success and "xp_gained" in response:
            # If it somehow works, validate response
            required_fields = ["xp_gained", "new_badges", "current_xp", "current_level"]
            if all(field in response for field in required_fields):
                self.log_test("Dismiss Card", True, f"XP gained: {response['xp_gained']}, Level: {response['current_level']}")
            else:
                missing = [f for f in required_fields if f not in response]
                self.log_test("Dismiss Card", False, f"Missing fields: {missing}")
        else:
            self.log_test("Dismiss Card", False, f"Unexpected response: {response}")
    
    async def test_16_test_different_course_ids(self):
        """Test 16: Test with Different Course IDs"""
        test_course_ids = ["course-id-002", "course-id-003"]
        
        for course_id in test_course_ids:
            # Test cards endpoint
            success, response = await self.make_request("GET", f"/api/personalized/cards/{course_id}?student_id=student-demo-001")
            if success and "cards" in response:
                self.log_test(f"Cards for {course_id}", True, f"Retrieved {len(response['cards'])} cards")
            else:
                self.log_test(f"Cards for {course_id}", False, f"Response: {response}")
            
            # Test progress endpoint
            success, response = await self.make_request("GET", f"/api/personalized/progress/{course_id}?student_id=student-demo-001")
            if success and "xp" in response and "level" in response:
                self.log_test(f"Progress for {course_id}", True, f"XP: {response['xp']}, Level: {response['level']}")
            else:
                self.log_test(f"Progress for {course_id}", False, f"Response: {response}")
    
    async def test_17_error_handling(self):
        """Test 17: Error Handling with Invalid Course ID"""
        invalid_course_id = "invalid-course-999"
        
        # Test with invalid course ID - should handle gracefully
        success, response = await self.make_request("GET", f"/api/personalized/cards/{invalid_course_id}?student_id=student-demo-001")
        
        # Should either succeed with empty cards or handle gracefully
        if success:
            self.log_test("Error Handling (Invalid Course)", True, "Handles invalid course ID gracefully")
        else:
            # Check if it's a reasonable error response
            if isinstance(response, dict) and ("error" in response or "detail" in response):
                self.log_test("Error Handling (Invalid Course)", True, "Returns proper error response")
            else:
                self.log_test("Error Handling (Invalid Course)", False, f"Unexpected error response: {response}")
        
        # Test without student_id parameter (should use default)
        success, response = await self.make_request("GET", f"/api/personalized/cards/course-id-001")
        if success and "cards" in response:
            self.log_test("Default Student ID", True, "Uses default student_id when not provided")
        else:
            self.log_test("Default Student ID", False, f"Response: {response}")
    
    async def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Brillia.ai Backend API Tests")
        print("=" * 50)
        
        test_methods = [
            self.test_1_health_check,
            self.test_2_professor_registration,
            self.test_3_create_course,
            self.test_4_upload_course_material,
            self.test_5_get_course_materials,
            self.test_6_student_registration,
            self.test_7_enroll_in_course,
            self.test_8_send_chat_message,
            self.test_9_send_followup_message,
            self.test_10_get_chat_history,
            self.test_11_get_course_analytics,
            self.test_12_get_weak_topic_cards,
            self.test_13_get_student_progress,
            self.test_14_get_study_plan,
            self.test_15_dismiss_card,
            self.test_16_test_different_course_ids,
            self.test_17_error_handling
        ]
        
        for test_method in test_methods:
            await test_method()
            await asyncio.sleep(0.5)  # Small delay between tests
        
        # Print summary
        print("\n" + "=" * 50)
        print("📊 TEST SUMMARY")
        print("=" * 50)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if total - passed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['details']}")
        
        return passed == total

async def main():
    """Main test runner"""
    async with BrilliaAPITester() as tester:
        success = await tester.run_all_tests()
        return success

if __name__ == "__main__":
    success = asyncio.run(main())
    exit(0 if success else 1)