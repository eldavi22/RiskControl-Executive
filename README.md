**RiskControl Executive**

I built RiskControl Executive to make it easier to keep track of economic indicators and work with the data behind them. It's a small Node.js and Express application where you can save records, look them up, and update information without creating duplicate entries for the same date.

The current version stores data locally and checks incoming information before saving it. I also added automated tests to make sure the main features keep working as I make changes.

You can run it with `npm ci` and `npm start`, then check it with `npm test`. The source code is available under the MIT license.
