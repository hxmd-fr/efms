Enterprise Finance Management System (EFMS)
An advanced, data-driven financial management dashboard built with Next.js, Tailwind CSS, and MySQL. EFMS provides real-time insights into key business metrics, leveraging a secure backend API to connect directly to your financial database. This project is designed to be a comprehensive solution for managing employees, transactions, budgets, and leveraging AI for predictive analysis and fraud detection.

✨ Key Features
Dynamic Real-time Dashboard: Displays live, up-to-the-second data on total employees, monthly expenses, and budget utilization fetched directly from the database.

Secure Backend API: A robust Next.js API route handles all database communication, ensuring that sensitive credentials are never exposed to the client-side.

Tab-Based Interface: A clean and modern UI with tabbed navigation to seamlessly switch between the main Dashboard, AI Prediction, and Fraud Detection modules.

Component-Based Architecture: Built with reusable React components for statistics cards, navigation, and UI elements, ensuring clean and maintainable code.

Robust Data Fetching: Includes elegant loading and error states to provide a smooth user experience, even if the database connection is slow or fails.

Custom SQL Schema: Powered by a detailed MySQL schema featuring tables for users, employees, transactions, payroll, and budgeting.

🛠️ Technology Stack
Frontend: Next.js (React Framework) & Tailwind CSS

Backend: Next.js API Routes (Node.js)

Database: MySQL

Data Fetching: mysql2 library

Icons: Lucide React

🗂️ Database Schema Overview <br>
The system is built on a relational MySQL database designed to handle core financial and employee data.

Users & Employees: Manage user accounts and their corresponding employee profiles, including roles and join dates.

Accounts & Transactions: Form the core of the financial ledger, tracking all debits and credits against different account types (Asset, Expense, etc.).

Budget: Track departmental budget allocation versus actual spending.

Invoices & Vendors: Manage payables and vendor relationships.

v_monthly_expense (View): A pre-calculated SQL view for efficiently querying total expenses per month.

🚀 Getting Started
Follow these instructions to set up and run the project on your local machine.

Prerequisites
Node.js (v18.0 or later recommended)

A database management tool like MySQL Workbench 

1. Clone the Repository <br>
```
git clone [https://github.com/hxmd-fr/efms.git](https://github.com/hxmd-fr/efms.git) 
cd efms-project
```

2. Install Dependencies <br>
Install the required npm packages. <br>

   ```npm install```

3. Set Up the Database <br>
Connect to your MySQL server.

Create a new database. The project expects the name financedb by default.

CREATE DATABASE financedb;

Execute the full SQL schema script to create all the tables, views, and insert the sample data.

4. Configure Environment Variables <br>
Create a new file named ```.env.local``` in the root of your project.

Fill in your actual MySQL database credentials.

.env.local template:

```
# .env.local
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=financedb
```
5. Run the Development Server
Start the Next.js application.

   ```npm run dev```

Open http://localhost:3000 in your browser to see the application running. Navigate to /dashboard to view the main dashboard.
