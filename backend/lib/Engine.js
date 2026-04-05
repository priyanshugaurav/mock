class MockEngineUtils {
  /**
   * Generates a random integer between min and max (inclusive).
   */
  static getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Calculates the Greatest Common Divisor (GCD) using Euclidean algorithm.
   */
  static getGCD(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
      let t = b;
      b = a % b;
      a = t;
    }
    return a;
  }

  /**
   * Calculates the Least Common Multiple (LCM).
   */
  static getLCM(a, b) {
    return Math.abs(a * b) / this.getGCD(a, b);
  }

  /**
   * Shuffles an array in place using Fisher-Yates algorithm.
   */
  static shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * Generates plausible wrong options given the correct answer.
   * Useful for basic numeric answers.
   */
  static generateDistractors(correctAnswer, count = 3, range = 5) {
    const distractors = new Set();
    const isCurrency = correctAnswer.toString().includes('₹');
    const numericPart = parseInt(correctAnswer.toString().replace(/[^0-9]/g, ''), 10);

    // Try to figure out the type
    while(distractors.size < count) {
       // Offset by a small random amount
       let offset = this.getRandomInt(-range, range);
       if(offset === 0) offset = 1;
       let wrongNum = numericPart + offset;
       
       if (wrongNum <= 0) wrongNum = numericPart + Math.abs(offset) + 1; // Keep it positive

       let wrongStr = isCurrency ? `₹${wrongNum}` : `${wrongNum}`;
       if (wrongStr !== correctAnswer.toString()) {
           distractors.add(wrongStr);
       }
    }
    return Array.from(distractors);
  }
}

module.exports = MockEngineUtils;
