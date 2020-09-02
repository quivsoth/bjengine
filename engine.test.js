const engine = require('./engine');

 let card1 = {
        id: 2,
        suit: "Hearts",
        cardFace: "Two",
        cardValue: 2
    }
    let card2 = {
        id: 12,
        suit: "Spades",
        cardFace: "Ace",
        cardValue: "A"
    }
    let card3 = {
        id: 2,
        suit: "Hearts",
        cardFace: "Two",
        cardValue: 2
    }
    let card4 = {
        id: 2,
        suit: "Hearts",
        cardFace: "Ten",
        cardValue: 10
    }
    let card5 = {
        id: 12,
        suit: "Hearts",
        cardFace: "Ace",
        cardValue: "A"
    }
test('Test cards in the Array to see if an Ace is amongst them ', () => {
    const cards = [];
    cards.push(card2, card4);
    // engine.AceCheck(cards);
    let result = engine.aceCheck(cards);
    expect(result).toBe(true);
});
test('Test the autorunner ', () => {
    const cards = [];
    cards.push(card2, card5);
    // // engine.AceCheck(cards);
    // let result = engine.AutoRun(cards, card4);
    // console.log(result);
    // expect(g).toBe(true);

    console.log("card 2: " + card2);
    console.log(card2);
    // console.log("card 3: " + card3.cardValue);
    // cards.forEach(card => {
    //     console.log(card.cardValue);
    // });

    const sorted = cards.sort(function(a,b){ return ((+b.cardValue==b.cardValue) && (+a.cardValue != a.cardValue)) || (a.cardValue - b.cardValue) }).reverse();
    const handCode = sorted[0].cardValue + "," + sorted[1].cardValue;
	// console.log(handCode);
});