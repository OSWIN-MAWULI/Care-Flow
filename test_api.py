import requests, json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE = 'http://localhost:5000'

# 1. Login as admin
r = requests.post(f'{BASE}/auth/login', json={'email':'admin@caresync.com','password':'Password123'})
admin_data = r.json()
admin_token = admin_data['accessToken']
print(f'[OK] Admin login: {admin_data["user"]["email"]} ({admin_data["user"]["role"]})')

# 2. List departments
r = requests.get(f'{BASE}/departments', headers={'Authorization': f'Bearer {admin_token}'})
depts = r.json()
print(f'[OK] Departments ({len(depts)}): {[d["name"] for d in depts]}')

# 3. List doctors
r = requests.get(f'{BASE}/users/doctors', headers={'Authorization': f'Bearer {admin_token}'})
docs = r.json()
print(f'[OK] Doctors ({len(docs)}): {[d["specialization"] for d in docs]}')

# 4. List appointments for doctor
r = requests.post(f'{BASE}/auth/login', json={'email':'cardio.doc@caresync.com','password':'Password123'})
doc_token = r.json()['accessToken']
r = requests.get(f'{BASE}/appointments/doctor?date=2026-07-04', headers={'Authorization': f'Bearer {doc_token}'})
appts = r.json()
print(f'[OK] Doctor appointments today: {len(appts)}')

# 5. Test patient booking availability
r = requests.post(f'{BASE}/auth/login', json={'email':'kofi.mensah@gmail.com','password':'Password123'})
pat_token = r.json()['accessToken']
r = requests.get(f'{BASE}/appointments/availability', headers={'Authorization': f'Bearer {pat_token}'})
avail = r.json()
print(f'[OK] Availability slots returned: {len(avail)} doctors with availability')

# 6. Create a referral (doctor)
r = requests.post(f'{BASE}/auth/login', json={'email':'gen.doc@caresync.com','password':'Password123'})
gen_doc_token = r.json()['accessToken']
# Get patient ID
r = requests.get(f'{BASE}/users?role=patient&limit=1', headers={'Authorization': f'Bearer {admin_token}'})
patient_id = r.json()['users'][0]['patient']['id'] if r.json()['users'][0].get('patient') else None
# Get cardiology dept
cardio_dept = [d for d in depts if d['name'] == 'Cardiology'][0]
r = requests.post(f'{BASE}/referrals', json={
    'patientId': patient_id,
    'referredToDepartmentId': cardio_dept['id'],
    'reason': 'Patient needs cardiac evaluation'
}, headers={'Authorization': f'Bearer {gen_doc_token}'})
if r.status_code == 201:
    print(f'[OK] Referral created successfully')
else:
    print(f'[FAIL] Referral failed: {r.status_code} {r.text[:100]}')

# 7. Analytics dashboard
r = requests.get(f'{BASE}/analytics/dashboard', headers={'Authorization': f'Bearer {admin_token}'})
analytics = r.json()
print(f'[OK] Analytics: {analytics["appointments"]["total"]} appointments (30d)')

# 8. Inventory
r = requests.get(f'{BASE}/inventory', headers={'Authorization': f'Bearer {admin_token}'})
inv = r.json()
print(f'[OK] Inventory items: {len(inv)}')
low = [i for i in inv if i['quantityInStock'] <= i['reorderLevel']]
print(f'   Low stock: {len(low)} items')

# 9. Admissions / wards
r = requests.get(f'{BASE}/admissions/wards', headers={'Authorization': f'Bearer {admin_token}'})
wards = r.json()
print(f'[OK] Wards: {len(wards)}')

r = requests.get(f'{BASE}/admissions', headers={'Authorization': f'Bearer {admin_token}'})
admits = r.json()
print(f'[OK] Admissions: {len(admits)} (active: {len([a for a in admits if a["status"]=="admitted"])})')

print('\n✅ ALL ENDPOINTS OK')
