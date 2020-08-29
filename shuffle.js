const Deck = require('./deck');

  var Shuffle = (array) => {
    let shuffled = array.Deck;
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
  };

  const MultiShuffle = () => {
    const newDeck = {Deck};
    let deck = Shuffle(newDeck).map(a => ({...a}));
    let deck2 = Shuffle(newDeck).map(a => ({...a}));
    let deck3 = Shuffle(newDeck).map(a => ({...a}));
    let deck4 = Shuffle(newDeck).map(a => ({...a}));
    let deck5 = Shuffle(newDeck).map(a => ({...a}));
    let deck6 = Shuffle(newDeck).map(a => ({...a}));
    deck.push(...deck2, ...deck3, ...deck4, ...deck5, ...deck6);

    return deck;
  }

module.exports = MultiShuffle;