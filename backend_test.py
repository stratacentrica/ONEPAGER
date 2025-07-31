import requests
import sys
import json
import tempfile
import os
from datetime import datetime

class ONEderpageAPITester:
    def __init__(self, base_url="https://697b1230-743f-4af4-9f6f-4e7df73396ef.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.created_page_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, response_type='json'):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {}
        
        if files is None and data is not None:
            headers['Content-Type'] = 'application/json'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, data=data, files=files)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                
                if response_type == 'json' and response.content:
                    try:
                        return success, response.json()
                    except:
                        return success, response.text
                else:
                    return success, response.content
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, response = self.run_test(
            "Root API Endpoint",
            "GET",
            "api/",
            200
        )
        return success

    def test_create_page(self):
        """Test creating a new landing page"""
        page_data = {
            "title": f"Test Page {datetime.now().strftime('%H%M%S')}",
            "background_color": "#1a1a2e",
            "theme": "dark"
        }
        
        success, response = self.run_test(
            "Create Landing Page",
            "POST",
            "api/pages",
            200,
            data=page_data
        )
        
        if success and 'id' in response:
            self.created_page_id = response['id']
            print(f"   Created page ID: {self.created_page_id}")
            return True
        return False

    def test_get_pages(self):
        """Test getting all landing pages"""
        success, response = self.run_test(
            "Get All Pages",
            "GET",
            "api/pages",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} pages")
            return True
        return False

    def test_get_single_page(self):
        """Test getting a specific landing page"""
        if not self.created_page_id:
            print("❌ No page ID available for single page test")
            return False
            
        success, response = self.run_test(
            "Get Single Page",
            "GET",
            f"api/pages/{self.created_page_id}",
            200
        )
        
        if success and 'id' in response:
            print(f"   Retrieved page: {response.get('title', 'Unknown')}")
            return True
        return False

    def test_update_page(self):
        """Test updating a landing page"""
        if not self.created_page_id:
            print("❌ No page ID available for update test")
            return False
            
        update_data = {
            "title": "Updated Test Page",
            "background_color": "#2a2a3e",
            "theme": "light"
        }
        
        success, response = self.run_test(
            "Update Page",
            "PUT",
            f"api/pages/{self.created_page_id}",
            200,
            data=update_data
        )
        
        if success and response.get('title') == "Updated Test Page":
            print(f"   Page updated successfully")
            return True
        return False

    def test_add_component(self):
        """Test adding a component to a page"""
        if not self.created_page_id:
            print("❌ No page ID available for component test")
            return False
            
        component_data = {
            "id": f"text-{datetime.now().strftime('%H%M%S')}",
            "type": "text",
            "content": {"text": "Test Text Component", "tag": "h1"},
            "position": {"x": 100, "y": 100},
            "style": {
                "color": "#ffffff",
                "fontSize": 24,
                "background": "rgba(255, 255, 255, 0.1)",
                "borderRadius": "12px"
            }
        }
        
        success, response = self.run_test(
            "Add Component",
            "POST",
            f"api/pages/{self.created_page_id}/components",
            200,
            data=component_data
        )
        return success

    def test_royalty_free_sounds(self):
        """Test getting royalty-free sounds"""
        success, response = self.run_test(
            "Get Royalty-Free Sounds",
            "GET",
            "api/royalty-free-sounds",
            200
        )
        
        if success and 'sounds' in response:
            print(f"   Found {len(response['sounds'])} sounds")
            return True
        return False

    def test_image_upload(self):
        """Test image upload functionality"""
        # Create a simple test image file
        test_image_content = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\nIDATx\x9cc\xf8\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00IEND\xaeB`\x82'
        
        files = {
            'file': ('test.png', test_image_content, 'image/png')
        }
        
        success, response = self.run_test(
            "Upload Image",
            "POST",
            "api/upload/image",
            200,
            files=files
        )
        
        if success and 'url' in response:
            print(f"   Image uploaded: {response['url']}")
            return True
        return False

    def test_export_page(self):
        """Test page export functionality"""
        if not self.created_page_id:
            print("❌ No page ID available for export test")
            return False
            
        export_data = {
            "page_id": self.created_page_id,
            "format": "html"
        }
            
        success, response = self.run_test(
            "Export Page",
            "POST",
            f"api/pages/{self.created_page_id}/export",
            200,
            data=export_data,
            response_type='html'
        )
        
        if success and b'<!DOCTYPE html>' in response:
            print(f"   HTML export generated successfully")
            return True
        return False

    def test_embed_code(self):
        """Test getting embed code"""
        if not self.created_page_id:
            print("❌ No page ID available for embed test")
            return False
            
        success, response = self.run_test(
            "Get Embed Code",
            "POST",
            f"api/pages/{self.created_page_id}/embed-code",
            200
        )
        
        if success and 'embed_code' in response:
            print(f"   Embed code generated successfully")
            return True
        return False

    def test_delete_page(self):
        """Test deleting a landing page"""
        if not self.created_page_id:
            print("❌ No page ID available for delete test")
            return False
            
        success, response = self.run_test(
            "Delete Page",
            "DELETE",
            f"api/pages/{self.created_page_id}",
            200
        )
        
        if success:
            print(f"   Page deleted successfully")
            return True
        return False

def main():
    print("🚀 Starting ONEderpage API Tests")
    print("=" * 50)
    
    tester = ONEderpageAPITester()
    
    # Run all tests in sequence
    test_results = []
    
    test_results.append(tester.test_root_endpoint())
    test_results.append(tester.test_create_page())
    test_results.append(tester.test_get_pages())
    test_results.append(tester.test_get_single_page())
    test_results.append(tester.test_update_page())
    test_results.append(tester.test_add_component())
    test_results.append(tester.test_royalty_free_sounds())
    test_results.append(tester.test_image_upload())
    test_results.append(tester.test_export_page())
    test_results.append(tester.test_embed_code())
    test_results.append(tester.test_delete_page())
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 FINAL RESULTS")
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())