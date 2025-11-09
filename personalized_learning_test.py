#!/usr/bin/env python3
"""
Brillia.ai Personalized Learning Endpoints Test
Focused testing of the new personalized learning features
"""

import asyncio
import aiohttp
import json

# Backend URL
BACKEND_URL = "https://smart-tutor-98.preview.emergentagent.com"

class PersonalizedLearningTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = None
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
    
    async def make_request(self, method: str, endpoint: str, data: any = None) -> tuple[bool, any]:
        """Make HTTP request and return (success, response_data)"""
        url = f"{self.base_url}{endpoint}"
        headers = {}
        
        try:
            if method.upper() == "GET":
                async with self.session.get(url, headers=headers) as response:
                    response_data = await response.json()
                    return response.status in [200, 201], response_data
            
            elif method.upper() == "POST":
                headers["Content-Type"] = "application/json"
                async with self.session.post(url, json=data, headers=headers) as response:
                    response_data = await response.json()
                    return response.status in [200, 201], response_data
                    
        except Exception as e:
            return False, {"error": str(e)}
    
    async def test_1_get_weak_topic_cards(self):
        """Test 1: Get Weak Topic Cards - course-id-001"""
        success, response = await self.make_request("GET", "/api/personalized/cards/course-id-001?student_id=student-demo-001")
        
        if success and "cards" in response:
            cards = response["cards"]
            self.log_test("Get Weak Topic Cards (course-id-001)", True, f"Retrieved {len(cards)} cards")
            
            # If cards exist, validate structure
            if cards:
                card = cards[0]
                required_fields = ["id", "concept", "card_type", "content_summary", "priority"]
                if all(field in card for field in required_fields):
                    self.log_test("Card Structure Validation", True, f"Card has all required fields: {list(card.keys())}")
                else:
                    missing = [f for f in required_fields if f not in card]
                    self.log_test("Card Structure Validation", False, f"Missing fields: {missing}")
            else:
                self.log_test("Empty Cards Response", True, "No cards returned (expected for new feature)")
        else:
            self.log_test("Get Weak Topic Cards (course-id-001)", False, f"Response: {response}")
    
    async def test_2_get_student_progress(self):
        """Test 2: Get Student Progress - course-id-001"""
        success, response = await self.make_request("GET", "/api/personalized/progress/course-id-001?student_id=student-demo-001")
        
        if success:
            required_fields = ["xp", "level", "level_name", "study_streak", "badges_earned", "available_badges"]
            if all(field in response for field in required_fields):
                xp = response["xp"]
                level = response["level"]
                level_name = response["level_name"]
                
                # Validate data types and values
                if isinstance(xp, int) and isinstance(level, int) and level_name in ["Beginner", "Intermediate", "Advanced"]:
                    self.log_test("Get Student Progress (course-id-001)", True, 
                                f"XP: {xp}, Level: {level} ({level_name}), Streak: {response['study_streak']}")
                    
                    # Validate badges structure
                    badges_earned = response["badges_earned"]
                    available_badges = response["available_badges"]
                    if isinstance(badges_earned, list) and isinstance(available_badges, list):
                        self.log_test("Badges Structure", True, f"Earned: {len(badges_earned)}, Available: {len(available_badges)}")
                    else:
                        self.log_test("Badges Structure", False, f"Invalid badge types: {type(badges_earned)}, {type(available_badges)}")
                else:
                    self.log_test("Get Student Progress (course-id-001)", False, 
                                f"Invalid data types - XP: {type(xp)}, Level: {type(level)}, Level Name: {level_name}")
            else:
                missing = [f for f in required_fields if f not in response]
                self.log_test("Get Student Progress (course-id-001)", False, f"Missing fields: {missing}")
        else:
            self.log_test("Get Student Progress (course-id-001)", False, f"Response: {response}")
    
    async def test_3_get_study_plan(self):
        """Test 3: Get Study Plan - course-id-001"""
        success, response = await self.make_request("GET", "/api/personalized/study-plan/course-id-001?student_id=student-demo-001")
        
        if success:
            required_fields = ["daily_focus", "recommended_topics", "total_estimated_time"]
            if all(field in response for field in required_fields):
                daily_focus = response["daily_focus"]
                recommended_topics = response["recommended_topics"]
                total_time = response["total_estimated_time"]
                
                # Validate structure
                if isinstance(recommended_topics, list) and isinstance(total_time, int):
                    self.log_test("Get Study Plan (course-id-001)", True, 
                                f"Daily focus: '{daily_focus[:50]}...', {len(recommended_topics)} topics, {total_time}min total")
                    
                    # Check if no weak topics message (expected for new feature)
                    if "Great job!" in daily_focus or "All concepts are well understood" in daily_focus:
                        self.log_test("Study Plan Empty State", True, "Properly handles no weak topics scenario")
                    
                    # Validate topic structure if any exist
                    if recommended_topics:
                        topic = recommended_topics[0]
                        topic_fields = ["concept", "current_mastery", "estimated_time", "priority", "recommended_action"]
                        if all(field in topic for field in topic_fields):
                            self.log_test("Topic Structure", True, f"Topic has all required fields")
                        else:
                            missing = [f for f in topic_fields if f not in topic]
                            self.log_test("Topic Structure", False, f"Missing topic fields: {missing}")
                else:
                    self.log_test("Get Study Plan (course-id-001)", False, 
                                f"Invalid data types - Topics: {type(recommended_topics)}, Time: {type(total_time)}")
            else:
                missing = [f for f in required_fields if f not in response]
                self.log_test("Get Study Plan (course-id-001)", False, f"Missing fields: {missing}")
        else:
            self.log_test("Get Study Plan (course-id-001)", False, f"Response: {response}")
    
    async def test_4_dismiss_card(self):
        """Test 4: Dismiss Card (Expected 404 for new feature)"""
        data = {
            "card_id": "test-card-id",
            "correct": True
        }
        
        success, response = await self.make_request("POST", "/api/personalized/cards/dismiss?student_id=student-demo-001", data)
        
        # Expect 404 since no cards exist yet
        if not success and ("not found" in str(response).lower() or "404" in str(response)):
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
    
    async def test_5_different_course_ids(self):
        """Test 5: Test with Different Course IDs"""
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
            
            # Test study plan endpoint
            success, response = await self.make_request("GET", f"/api/personalized/study-plan/{course_id}?student_id=student-demo-001")
            if success and "daily_focus" in response:
                self.log_test(f"Study Plan for {course_id}", True, f"Daily focus available")
            else:
                self.log_test(f"Study Plan for {course_id}", False, f"Response: {response}")
    
    async def test_6_error_handling(self):
        """Test 6: Error Handling"""
        # Test with invalid course ID
        invalid_course_id = "invalid-course-999"
        
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
        success, response = await self.make_request("GET", "/api/personalized/cards/course-id-001")
        if success and "cards" in response:
            self.log_test("Default Student ID", True, "Uses default student_id when not provided")
        else:
            self.log_test("Default Student ID", False, f"Response: {response}")
    
    async def run_all_tests(self):
        """Run all personalized learning tests"""
        print("🚀 Starting Personalized Learning Endpoints Test")
        print("=" * 60)
        
        test_methods = [
            self.test_1_get_weak_topic_cards,
            self.test_2_get_student_progress,
            self.test_3_get_study_plan,
            self.test_4_dismiss_card,
            self.test_5_different_course_ids,
            self.test_6_error_handling
        ]
        
        for test_method in test_methods:
            await test_method()
            await asyncio.sleep(0.3)  # Small delay between tests
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 PERSONALIZED LEARNING TEST SUMMARY")
        print("=" * 60)
        
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
        
        print("\n✅ PASSED TESTS:")
        for result in self.test_results:
            if result["success"]:
                print(f"  - {result['test']}: {result['details']}")
        
        return passed == total

async def main():
    """Main test runner"""
    async with PersonalizedLearningTester() as tester:
        success = await tester.run_all_tests()
        return success

if __name__ == "__main__":
    success = asyncio.run(main())
    exit(0 if success else 1)