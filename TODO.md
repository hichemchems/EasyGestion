# TODO List for EasyGestion Enhancements

## 1. Verify and Fix Dashboard Button Routes
- Check all buttons in AdminDashboard and UserDashboard for correct routing.
- Fix any broken or missing routes to ensure navigation works as expected.

## 2. Implement Prestations (Services) Management
- Create UI in PackageManagement component to allow admins to add, edit, delete prestations.
- Ensure prestations are customizable and new ones can be created.
- Connect UI to backend CRUD endpoints for prestations.

## 3. Enhance Admin Dashboard Metrics
- Display the following metrics with correct values:
  - Panier Moyen (Average Basket)
  - Clients Aujourd'hui (Clients Today)
  - Chiffre d'Affaires Journalier (Daily Turnover)
  - Prévision (Forecast)
  - Total daily salaries paid to barbers (calculated as percentage deducted from prestations)
- Show €0.00 as default when no data.

## 4. Add Salary Graphs to Admin Dashboard
- Add a graph at the bottom showing daily salaries for the current month.
- Add a line chart above showing monthly total salaries over the past 12 months.
- Enable clicking on a month in the line chart to view detailed salaries of barbers for that month.

## 5. Backend Enhancements
- Implement or verify backend endpoints to provide salary aggregation data for daily and monthly views.
- Ensure salary calculations consider percentage deductions from prestations.
- Add endpoints to fetch detailed salary data per barber per month.

## 6. Testing
- Thoroughly test all new and existing features:
  - UI navigation and button routes.
  - Prestations management CRUD operations.
  - Dashboard metrics accuracy and updates.
  - Salary graphs interactivity and data correctness.
  - Backend API endpoints for salaries and prestations.
  - Edge cases and error handling.

## 7. Documentation and Code Cleanup
- Update documentation for new features and API endpoints.
- Clean up code and remove any deprecated or unused code.

---

Please confirm if you want me to start working on these tasks in the order listed or if you want to prioritize specific items.
