const Engine = require('../Engine');
const { v4: uuidv4 } = require('uuid');

class RatioTemplates {

  static generate() {
    const templates = [
      this.generateSimplifyRatio,
      this.generateDivideAmount,
      this.generateBoysGirlsRatio
    ];
    // Randomly pick one template
    const picker = Math.floor(Math.random() * templates.length);
    return templates[picker].call(this);
  }

  // Question 1: Simplify the ratio A : B
  static generateSimplifyRatio() {
    const multiplier = Engine.getRandomInt(2, 8);
    const baseA = Engine.getRandomInt(2, 9);
    const baseB = Engine.getRandomInt(2, 9);
    
    // Ensure they aren't the same and are somewhat co-prime for a clean result
    if (baseA === baseB) return this.generateSimplifyRatio();
    
    const a = baseA * multiplier;
    const b = baseB * multiplier;
    const gcd = Engine.getGCD(a, b);
    
    const finalA = a / gcd;
    const finalB = b / gcd;
    
    const correctAnswer = `${finalA} : ${finalB}`;
    
    // Distractors
    const optionsArray = [
      correctAnswer,
      `${finalB} : ${finalA}`, // Reversed
      `${finalA + 1} : ${finalB}`,
      `${finalA} : ${finalB + 1}`
    ];
    
    // De-dupe and shuffle ensuring we have 4 options
    const optionsSet = Array.from(new Set(optionsArray));
    while(optionsSet.length < 4) {
      optionsSet.push(`${Engine.getRandomInt(1, 9)} : ${Engine.getRandomInt(1, 9)}`);
    }
    const finalOptions = Engine.shuffleArray(optionsSet.slice(0, 4));
    const correctIndex = finalOptions.indexOf(correctAnswer);

    return {
      id: uuidv4() || Math.random().toString(),
      question: `Simplify the ratio ${a} : ${b}`,
      options: finalOptions,
      correctIndex: correctIndex,
      topic: 'ratio',
      difficulty: 'easy',
      latexSteps: [
        { label: 'given', math: `\\text{Ratio} = ${a} : ${b}` },
        { label: 'step 1', math: `\\text{HCF}(${a}, ${b}) = ${gcd}`, sub: 'Find HCF' },
        { label: 'step 2', math: `\\frac{${a}}{${gcd}} : \\frac{${b}}{${gcd}}`, sub: 'Divide by HCF' },
        { label: 'result', math: `\\therefore \\text{Ratio} = ${finalA} : ${finalB}` }
      ]
    };
  }

  // Question 2: Divide Amount in Ratio
  static generateDivideAmount() {
    const partA = Engine.getRandomInt(2, 5);
    const partB = Engine.getRandomInt(3, 7);
    if (partA === partB) return this.generateDivideAmount();

    const totalParts = partA + partB;
    const multiplier = Engine.getRandomInt(3, 10) * 10; // e.g., 30, 40, 50...100
    const totalAmount = totalParts * multiplier;
    
    // Choose randomly whether to ask for larger, smaller or specific share
    const isLarger = partA > partB ? true : false; 
    // Wait, let's just find the larger one programmatically
    const largerPart = Math.max(partA, partB);
    const share = largerPart * multiplier;
    
    const correctAnswer = `₹${share}`;
    
    const options = Engine.generateDistractors(correctAnswer, 3, multiplier);
    options.push(correctAnswer);
    const finalOptions = Engine.shuffleArray(options);
    const correctIndex = finalOptions.indexOf(correctAnswer);

    return {
      id: uuidv4() || Math.random().toString(),
      question: `Divide ₹${totalAmount} in the ratio ${partA} : ${partB}. What is the larger share?`,
      options: finalOptions,
      correctIndex: correctIndex,
      topic: 'ratio',
      difficulty: 'medium',
      latexSteps: [
        { label: 'given', math: `\\text{Total} = ₹${totalAmount}, \\text{ Ratio} = ${partA} : ${partB}` },
        { label: 'step 1', math: `${partA} + ${partB} = ${totalParts}`, sub: 'Total parts' },
        { label: 'step 2', math: `\\frac{${totalAmount}}{${totalParts}} = ${multiplier}`, sub: 'One part value' },
        { label: 'step 3', math: `${largerPart} \\times ${multiplier} = ${share}`, sub: 'Calculate share' },
        { label: 'result', math: `\\therefore \\text{Share} = ₹${share}` }
      ]
    };
  }

  // Question 3: Boys to Girls
  static generateBoysGirlsRatio() {
    const boysRatio = Engine.getRandomInt(2, 5);
    const girlsRatio = Engine.getRandomInt(3, 6);
    if (boysRatio === girlsRatio) return this.generateBoysGirlsRatio();

    const multiplier = Engine.getRandomInt(3, 10);
    const actualGirls = girlsRatio * multiplier;
    const actualBoys = boysRatio * multiplier;

    const correctAnswer = `${actualBoys}`;
    const options = Engine.generateDistractors(correctAnswer, 3, 2);
    options.push(correctAnswer);
    const finalOptions = Engine.shuffleArray(options);
    const correctIndex = finalOptions.indexOf(correctAnswer);

    return {
      id: uuidv4() || Math.random().toString(),
      question: `If boys to girls is ${boysRatio}:${girlsRatio} and there are ${actualGirls} girls, how many boys are there?`,
      options: finalOptions,
      correctIndex: correctIndex,
      topic: 'ratio',
      difficulty: 'medium',
      latexSteps: [
        { label: 'given', math: `\\text{Ratio} = ${boysRatio}:${girlsRatio}, \\text{ Girls} = ${actualGirls}` },
        { label: 'step 1', math: `\\text{Let Boys} = ${boysRatio}x, \\text{ Girls} = ${girlsRatio}x` },
        { label: 'step 2', math: `${girlsRatio}x = ${actualGirls} \\implies x = ${multiplier}`, sub: 'Solve for x' },
        { label: 'step 3', math: `${boysRatio}x = ${boysRatio}(${multiplier}) = ${actualBoys}`, sub: 'Calculate boys' },
        { label: 'result', math: `\\therefore \\text{Boys} = ${actualBoys}` }
      ]
    };
  }
}

module.exports = RatioTemplates;
