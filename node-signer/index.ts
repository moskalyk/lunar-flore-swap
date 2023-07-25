// import {fetch} from 'node-fetch'
import { ethers } from 'ethers'

const wait = async (ms: number) => {
    await new Promise(resolve => setTimeout(resolve, ms));
}

// Define a function to convert the month abbreviation to a numerical value
function getMonthNumber(monthAbbr) {
    const months = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
    };
    return months[monthAbbr];
  }

function getPriceWithDeviation(price, genesisTimestamp) {
    const millisecondsInCycle = 2555200 * 1000; // 2555200 seconds to milliseconds
    const currentTime = Date.now();
    const timeDifference = currentTime - genesisTimestamp;

    // Calculate the phase of the sine wave (ranging from 0 to 2 * Math.PI)
    const phase = (2 * Math.PI * timeDifference) / millisecondsInCycle;

    // Calculate the deviation factor using the sine function (oscillating between -1 and 1)
    const deviationFactor = Math.sin(phase);

    // Calculate the deviation amount (5% of the price) and apply it to the original price
    const deviationAmount = 0.05 * deviationFactor;

    // Calculate the final price after deviation
    const finalPrice = price * (1 + deviationAmount);

    return finalPrice;
}
  

(async () => {
    const price = 100
    let block = 0;
    const cycle = 2555200;
    const url = 'https://nodes.sequence.app/polygon'
    const provider = new ethers.providers.JsonRpcProvider(url)
    // const newMoon = 1590818836

    const year = 2023; // Replace with the desired year
    const month = 6;    // 0-indexed month (0 for January, 1 for February, ..., 11 for December)
    const day = 17;     // Day of the month (1-31)
    const hours = 14;   // Hours (0-23)
    const minutes = 31; // Minutes (0-59)
    const seconds = 0;  // Seconds (0-59)

    // Create the Date object with the specified date and time
    const dateObject = new Date(year, month, day, hours, minutes, seconds);
    const newMoon = dateObject.getTime();

    for(;;){
        const price = 100; // Replace with the actual price value
        console.log(newMoon)
        const genesisTimestamp = 1689618660000; // Replace with the actual genesis timestamp
        const finalPrice = getPriceWithDeviation(price, newMoon);
        console.log("Final price with deviation:", finalPrice*10**18);
    }
})()