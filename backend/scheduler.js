const cron = require('node-cron');
const { Goal, Alert, Employee } = require('./models');
const { Op } = require('sequelize');

const setupScheduler = (io) => {

// Function to send daily alerts at 9 AM
const sendDailyAlerts = async () => {
  try {
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // JS months 0-11
    const currentYear = today.getFullYear();

    // Get all goals for current month and year
    const goals = await Goal.findAll({
      where: {
        month: currentMonth,
        year: currentYear
      },
      include: [{
        model: Employee,
        as: 'employee'
      }]
    });

    for (const goal of goals) {
      const employee = goal.employee;
      if (!employee) continue;

      // Calculate remaining amount to reach monthly target
      const remaining = goal.monthly_target - goal.current_monthly_total;

      // Create alert message
      const message = `Objectif mensuel: ${goal.monthly_target}€, restant à atteindre: ${remaining.toFixed(2)}€`;

      // Create or update alert for employee
      await Alert.create({
        employee_id: employee.id,
        type: 'monthly_objective',
        message,
        data: {
          monthly_target: goal.monthly_target,
          remaining: remaining.toFixed(2)
        }
      });

      // Emit alert via socket.io to employee (if connected)
      io.emit(`alert_${employee.id}`, { message, remaining });
    }
  } catch (error) {
    console.error('Error sending daily alerts:', error);
  }
};

// Schedule the task to run every day at 9 AM server time
cron.schedule('0 9 * * *', () => {
  console.log('Running daily alert job at 9 AM');
  sendDailyAlerts();
});

// Function to process carry-over of unmet goals at the end of each month
const processCarryOver = async () => {
  try {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    // Get all goals for the previous month
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    const previousGoals = await Goal.findAll({
      where: {
        month: previousMonth,
        year: previousYear
      },
      include: [{
        model: Employee,
        as: 'employee'
      }]
    });

    // Calculate total unmet amount
    let totalUnmet = 0;
    const unmetGoals = [];

    for (const goal of previousGoals) {
      const unmet = goal.monthly_target - goal.current_monthly_total;
      if (unmet > 0) {
        totalUnmet += unmet;
        unmetGoals.push(goal);
      }
    }

    if (totalUnmet > 0 && unmetGoals.length > 0) {
      // Get all active employees for current month
      const activeEmployees = await Employee.findAll();

      // Distribute unmet amount equally among all barbers
      const carryOverPerBarber = totalUnmet / activeEmployees.length;

      // Update current month goals with carry-over
      for (const employee of activeEmployees) {
        let currentGoal = await Goal.findOne({
          where: {
            employee_id: employee.id,
            month: currentMonth,
            year: currentYear
          }
        });

        if (currentGoal) {
          // Add carry-over to existing goal
          await currentGoal.update({
            carry_over_amount: currentGoal.carry_over_amount + carryOverPerBarber,
            monthly_target: currentGoal.monthly_target + carryOverPerBarber
          });
        } else {
          // Create new goal with carry-over
          await Goal.create({
            employee_id: employee.id,
            month: currentMonth,
            year: currentYear,
            monthly_target: carryOverPerBarber,
            daily_target: carryOverPerBarber / 30, // Assuming 30 days
            current_monthly_total: 0,
            remaining_days: 30,
            carry_over_amount: carryOverPerBarber
          });
        }
      }

      console.log(`Processed carry-over: ${totalUnmet}€ distributed among ${activeEmployees.length} barbers`);
    }
  } catch (error) {
    console.error('Error processing carry-over:', error);
  }
};

// Schedule carry-over processing on the 1st of each month at 12 AM
cron.schedule('0 0 1 * *', () => {
  console.log('Running monthly carry-over job');
  processCarryOver();
});

  return {
    sendDailyAlerts,
    processCarryOver
  };
};

module.exports = setupScheduler;
