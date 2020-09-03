"use strict";
const yaml = require("js-yaml");
const fs = require("fs");
const MultiShuffle = require("./shuffle");

const aceCheck = (hand) => {
	try {
		let hasAce = false;
		let aces = hand.filter(function (cards) { return cards.cardFace == 'Ace'});
		let noAces = hand.filter(function (cards) { return cards.cardFace != 'Ace'});

		let result = 0;
		(noAces.length == 0 && aces.length >= 2) ? result = 0 : result = noAces.map(item => item.cardValue).reduce((a, b) => a + b);
		if (aces.length > 0) {
			hasAce = true;
			aces.forEach(card => {
				card.cardValue = 1;
				result += 1;
				if((result + 10) <= 21) {
					card.cardValue += 10;
					result += 10;
				}
			});
		}
		return hasAce;
	} catch (e) {
		console.log(e);
	}
}

var deck = MultiShuffle();
const isNanOrZero = n => isNaN(n) ? 0 : n
const rules = yaml.safeLoad(fs.readFileSync("./blackjackRules.yml", "utf8"));
const tally = (cards) => { return cards.map(item => item.cardValue).reduce((a, b) => a + b); }

const AutoRun = (cards, dealerCard) => {
	try {
		const hasAce = aceCheck(cards);
		const cardTally = tally(cards);
		if (cardTally > 21) { return cards; }

		//if soft 7 or less
		if(hasAce && cardTally <=7 ) {
			cards.push(deck.pop());
			AutoRun(cards, dealerCard);
		}

		//if soft 8 - eval against dealer card
		if(hasAce && cardTally == 8 ) //todo this will depend on the face card the dealer has

		//if soft 9 or higher, stand
		if(hasAce && cardTally >= 9 ) return cards;

		let hitOption = rules.filter((cards) => { return cards.Hand.PlayerTotal == cardTally });
		const shouldHit = hitOption[0].Hand.Hit.indexOf(dealerCard);
		if (shouldHit >= 0) {
			cards.push(deck.pop());
			AutoRun(cards, dealerCard);
		}
		return cards;
	} catch (e) {
		console.log(e);
	}
}

// Assigns a result to the playing hand based on the otucome. Result will either be 'W', 'L', 'P'
const EvaluateAgainstDealer = (playingHand) => {
	try {
		let dealerResult = {};
		//TODO - we need to eval if Dealer has blackjack first and stop players from hitting
		if(playingHand.outcome == "BJ") {
			let sorted = dealer.hand.cards[0].sort((a, b) => { return typeof a.cardValue < typeof b.cardValue ? 1 : -1; });
			if(sorted[0].cardFace == "Ace" && sorted[1].cardValue == 10) playingHand.result = "P"; //TODO insurance
			else playingHand.result = "W";
		}
		else if(playingHand.outcome == "B") playingHand.result = "L";
		else if(playingHand.outcome == "H" || playingHand.outcome == "F" || playingHand.outcome == "D" || playingHand.outcome == "S") {
			dealerResult = RunDealer(dealer.hand, false);
			if(playingHand.outcome == dealerResult.outcome) playingHand.result = "P";
			else if(dealerResult.outcome == "B" || (dealerResult.outcome < playingHand.outcome)) playingHand.result = "W";
			else playingHand.result = "L";
		} else console.log("ERROR : no outcome Assigned | " + playingHand.outcome)
	} catch (e) {
		console.log(e);
	}
}

// Assigns an outcome to the playing hand - otucomes will either be 'D', 'S', 'N', 'BJ, 'B', 'H', 'F'
const EvalPlayerHand = (playingHand, dealerCard) => {
	try {
		let cardTally = tally(playingHand.cards[0]);
		const sorted = playingHand.cards[0].sort((a, b) => { return typeof a.cardValue < typeof b.cardValue ? 1 : -1; });
		const handCode = sorted[0].cardValue + "," + sorted[1].cardValue;
		if(handCode == 'A,10') {
			playingHand.outcome = "BJ";
			return playingHand;
		}

		// Eval the handcode to see the options (all options will have an array)
		let hitOption = rules.filter(function (cards) { return cards.Hand.PlayerTotal == (handCode.includes('A') || (sorted[0].cardValue == sorted[1].cardValue) ? handCode : cardTally); });

		// Hit,split or double?
		const shouldDouble = hitOption[0].Hand.Double.indexOf(dealerCard);
		const shouldSplit = hitOption[0].Hand.Split.indexOf(dealerCard);
		const shouldHit = hitOption[0].Hand.Hit.indexOf(dealerCard);
		cardTally = tally(playingHand.cards[0]);				// Need to recheck this after splitting
		if (shouldDouble >= 0) playingHand.outcome = "D";		// D means double
		else if (shouldSplit >= 0) playingHand.outcome = "S";	// S means split
		//else if (shouldHit >= 0) AutoRun(sorted, dealerCard);
		else if (shouldHit >= 0) playingHand.outcome = "H";		// H means HIT
		else if (cardTally > 21) playingHand.outcome = "B";		// B means bust
		else  playingHand.outcome = "F";						// F means finished
		return playingHand;
	} catch (e) {
		console.log(e);
	}
}

const isBlackJack = (hand) => {
	try {
		const hasAce = hand.filter(function (cards) { return cards.cardFace == 'Ace'}).length > 0 ? true : false;
		const otherCard10 = hand.filter(function (cards) { return cards.cardValue == 10 }).length > 0 ? true : false;
		if(hand.length == 2 && hasAce && otherCard10)  return true;
		else return false;
	} catch (e) {
		console.log(e);
	}
}

var handId = 1;
let handResult = {};
let Play = (table) => {
	try{
		if(deck.length < 50)  {
			deck = {};
			deck = MultiShuffle();
			handId = 1;
			return;
		}
		table.dealer.hand.cards = [];
		table.dealer.hand.outcome = "";
		table.dealer.hand.cards.push([deck.pop(), deck.pop()]);
		table.players.forEach(player => {
			player.hand = [];
			player.hand.push({cards: [], outcome: "", result: "", bet: 1200 });
			player.hand[0].cards.push([deck.pop(), deck.pop()]);
		});
		RunTheDeck(table.players[0], table.dealer);
		table.players.forEach(player => {
			player.hand.forEach(hand => {
				handId++;
				aceCheck(hand.cards[0]); // TODO: lets fix this - it needs to convert the 'A' to numeric
				// Get the codes out of the array and create comma seperated value for the hand result
				const handCodes = [];
				const dealerHandCodes = [];
				hand.cards[0].forEach(card => handCodes.push(card.code));
				table.dealer.hand.cards[0].forEach(dCard => dealerHandCodes.push(dCard.code));
				handResult = 	{
					shoeId: 0,
					handId: handId,
					outcome: hand.outcome,
					result: hand.result,
					playerHand: tally(hand.cards[0]),
					dealerHand: tally(table.dealer.hand.cards[0]),
					playerCards: handCodes.join(','),
					dealerTotalCards: dealerHandCodes.join(',')
				}
				resultBuilder.push(handResult);
			});
		});
		Play(table);
	} catch (e) {
		console.log(e);
	}
}

const RunDealer = (hand, soft17) => {
	try{
		const hasAce = aceCheck(hand.cards[0]);
		const cardTally = tally(hand.cards[0]);
		cardTally > 21 ? hand.outcome = "B" : hand.outcome = cardTally;
		if((cardTally <= 16) || (soft17 && hasAce && cardTally == 17)) {
			hand.cards[0].push(deck.pop());
			RunDealer(hand);
		}
		return hand;
	} catch (e) {
		console.log(e);
	}
}

///	Returns the cards hit/split/double based on the cards dealt and what the dealer has + Evaluates the outcome - if required dealer runs
const RunTheDeck = (player, dealer) => {
	try {
		let playerResult = EvalPlayerHand(player.hand[0], dealer.hand.cards[0][0].cardValue);
		if((playerResult.outcome == "B") || (playerResult.outcome == "BJ") || (playerResult.outcome == "F")) EvaluateAgainstDealer(playerResult)
		else if (playerResult.outcome == "S") {
			const isTwoAces = (playerResult.cards[0][0].cardFace == "Ace" && playerResult.cards[0][1].cardFace == "Ace") ? true : false;
			player.hand[1] = { cards: [], outcome: "", result: "", bet: 1200 };
			player.hand[1].cards = [];
			player.hand[1].outcome = "S";
			player.hand[1].cards.push([player.hand[0].cards[0].pop(), deck.pop()]);
			player.hand[0].cards[0].push(deck.pop());
			player.hand.forEach(hand => {
				isTwoAces ? EvaluateAgainstDealer(hand) : EvaluateAgainstDealer(EvalPlayerHand(hand, dealer.hand.cards[0][0].cardValue));
			});
		} else if (playerResult.outcome == "D") {
			playerResult.cards[0].push(deck.pop());
			//playerResult.outcome = tally(playerResult.cards[0]);
			EvaluateAgainstDealer(playerResult);
		} else if (playerResult.outcome == "S") { }
		else if(playerResult.outcome == "H") {
			AutoRun(player.hand[0].cards[0], dealer.hand.cards[0][0].cardValue);
			EvaluateAgainstDealer(playerResult)
		}
		else console.log("ERROR: no outcome found : " + playerResult.outcome)
		return;
	} catch (e) {
		console.log(e);
	}
}

try {
	// //*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
	var Table = { players: [], shoeResult: [], dealer: {} }
	var player1 = { name: "Reed Smith", cash: 0, hand: [{cards: [], outcome: "", result: "", bet: 1200 }] }
	var dealer = { name: "Bollocks McBain", cash: 999999, hand: { cards: [], outcome: "" }}
	var resultBuilder = [];
	Table.dealer = dealer;									// Add dealer to the table
	Table.players.push(player1);							// Add player to the table
	var logger = fs.createWriteStream('result.txt', {flags: 'a' }); // 'a' means appending (old data will be preserved)
	//*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
	for (let j = 0; j < 500; j++) {
		logger = fs.createWriteStream('./result/shoe' + j + '.json', {flags: 'a' });
		for (let i = 0; i < 15000; i++) Play(Table);
		logger.write(JSON.stringify(resultBuilder));
		resultBuilder = [];
	}
	//*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
} catch (e) {
	console.log(e);
}
// module.exports = { aceCheck, AutoRun, MultiShuffle, EvalPlayerHand, EvaluateResult, RunDealer, RunTheDeck }