"use strict";
const yaml = require("js-yaml");
const fs = require("fs");
const MultiShuffle = require("./shuffle");

const engine = () => {
	const aceCheck = (hand) => {
		try {
			let hasAce = false;
			let aces = hand.filter(function (cards) { return cards.cardFace == 'Ace'});
			let noAces = hand.filter(function (cards) { return cards.cardFace != 'Ace'});
			let result = 0;
			(noAces.length == 0 && aces.length == 2) ? result = 2 : result = noAces.map(item => item.cardValue).reduce((a, b) => a + b);
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
			//console.log(e);
		}
	}
	var deck = MultiShuffle();
	const isNanOrZero = n => isNaN(n) ? 0 : n
	const rules = yaml.safeLoad(fs.readFileSync("./blackjackRules.yml", "utf8"));
	const tally = (cards) => { return cards.map(item => item.cardValue).reduce((a, b) => a + b); }

	const AutoRun = (cards, dealerCard) => {
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

		let hitOption = rules.filter(function (cards) { return cards.Hand.PlayerTotal == cardTally});
		const shouldHit = hitOption[0].Hand.Hit.indexOf(dealerCard);
		if (shouldHit >= 0) {
			cards.push(deck.pop());
			AutoRun(cards, dealerCard);
		}
		return cards;
	};

	const EvaluateResult = (playingHand) => {
		let dealerResult = {};
		if(playingHand.outcome == "BJ") {
			const sorted = dealer.hand.cards[0].sort(function(a,b){ return ((+b.cardValue==b.cardValue) && (+a.cardValue != a.cardValue)) || (a.cardValue - b.cardValue) }).reverse();
			if(sorted[0].cardFace == "Ace" && sorted[1].cardValue == 10) playingHand.result = "P"; //TODO insurance
			else playingHand.result = "W";
		}
		else if(playingHand.outcome == "B") playingHand.result = "L";
		else {
			dealerResult = RunDealer(dealer.hand, false);
			if(playingHand.outcome == dealerResult.outcome) playingHand.result = "P";
			else if(dealerResult.outcome == "B" || (dealerResult.outcome < playingHand.outcome)) playingHand.result = "W";
			else playingHand.result = "L";
		}
	}

	var handId = 1;
	let Play = (table) => {
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
		let handResult = {};
		table.players.forEach(player => {
			player.hand.forEach(hand => {
				handId++;
				// if(player.hand.length > 1) console.log("Two Hands------------------------\n");
				handResult = 	{
					shoeId: 0,
					handId: handId,
					outcome: hand.outcome,
					result: hand.result,
					playerHand: tally(hand.cards[0]),
					dealerHand: tally(table.dealer.hand.cards[0]),
					playerTotalCards: hand.cards[0].length,
					dealerTotalCards: table.dealer.hand.cards[0].length
					// playerHand: hand.cards[0],
					// dealerHand: table.dealer.hand.cards[0]
				}
				resultBuilder.push(handResult);
			});
		});
		Play(table);
	}

	const RunDealer = (hand, soft17) => {
		const hasAce = aceCheck(hand.cards[0]);
		const cardTally = tally(hand.cards[0]);
		cardTally > 21 ? hand.outcome = "B" : hand.outcome = cardTally;
		if((cardTally <= 16) || (soft17 && hasAce && cardTally == 17)) {
			hand.cards[0].push(deck.pop());
			RunDealer(hand);
		}
		return hand;
	}

	const EvalPlayerHand = (playingHand, dealerCard) => {
		let cardTally = tally(playingHand.cards[0]);
		const sorted = playingHand.cards[0].sort(function(a,b){ return ((+b.cardValue==b.cardValue) && (+a.cardValue != a.cardValue)) || (a.cardValue - b.cardValue) }).reverse();
		const handCode = sorted[0].cardValue + "," + sorted[1].cardValue;

		if(handCode == 'A,10') {
			playingHand.outcome = "BJ";
			return playingHand;
		}

		// Eval the handcode to see the options (all options will have an array)
		let hitOption = rules.filter(function (cards) { return cards.Hand.PlayerTotal == (handCode.includes('A') || (sorted[0].cardValue == sorted[1].cardValue) ? handCode : cardTally); });

		// Hit,split or double?
		const shouldDouble = hitOption[0].Hand.Double.indexOf(dealerCard);
		if (shouldDouble >= 0) {
			playingHand.outcome = "D";
			return playingHand;
		}

		const shouldSplit = hitOption[0].Hand.Split.indexOf(dealerCard);
		if (shouldSplit >= 0) {
			playingHand.outcome = "S";
			return playingHand;
		}

		const shouldHit = hitOption[0].Hand.Hit.indexOf(dealerCard);
		if (shouldHit >= 0) AutoRun(sorted, dealerCard);

		cardTally = tally(playingHand.cards[0]);
		if (cardTally > 21) {
			playingHand.outcome = "B";
			return playingHand;
		}
		// playingHand.outcome = tally(playingHand.cards[0]);
		playingHand.outcome = "N";		// NOTE: N stands for number
		//TODO Fix this - the tally is bringing back an A instead of the right number

		return playingHand;
	}

	///	Returns the cards hit/split/double based on the cards dealt and what the dealer has
	///	Evaluates the outcome - if required dealer runs
	const RunTheDeck = (player, dealer) => {
		let playerResult = EvalPlayerHand(player.hand[0], dealer.hand.cards[0][0].cardValue);
		if (playerResult.outcome == "S") {
			const isTwoAces = (playerResult.cards[0][0].cardFace == "Ace" && playerResult.cards[0][1].cardFace == "Ace") ? true : false;
			player.hand[1] = { cards: [], outcome: "", result: "", bet: 1200 };
			player.hand[1].cards = [];
			player.hand[1].outcome = "S";
			player.hand[1].cards.push([player.hand[0].cards[0].pop(), deck.pop()]);
			player.hand[0].cards[0].push(deck.pop());
			player.hand.forEach(hand => {
				isTwoAces ? EvaluateResult(hand) : EvaluateResult(EvalPlayerHand(hand, dealer.hand.cards[0][0].cardValue));
			});
		} else if (playerResult.outcome == "D") {
			playerResult.cards[0].push(deck.pop());
			playerResult.outcome = tally(playerResult.cards[0]);
			EvaluateResult(playerResult);
		}
		else EvaluateResult(playerResult);
		return;
	}
	try {
		//*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
		var Table = { players: [], shoeResult: [], dealer: {} }
		// let player1 = { name: "Ximeng Liu", cash: 0, hand: { cards: [], outcome: "", bet: 0} }
		var player1 = { name: "Reed Smith", cash: 0, hand: [{cards: [], outcome: "", result: "", bet: 1200 }] }
		var dealer = { name: "Bollocks McBain", cash: 999999, hand: { cards: [], outcome: "" }}
		var resultBuilder = [];
		Table.dealer = dealer;									// Add dealer to the table
		Table.players.push(player1);							// Add player to the table
		var logger = fs.createWriteStream('result.txt', {flags: 'a' }); // 'a' means appending (old data will be preserved)
		//*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
		// for (let j = 0; j < 20; j++) {
		// 	logger = fs.createWriteStream('result' + j + '.json.txt', {flags: 'a' });
		// 	for (let i = 0; i < 10000; i++) Play(Table);
		// 	logger.write(JSON.stringify(resultBuilder));
		// 	resultBuilder = [];
		// }
		Play(Table);
		logger.write(JSON.stringify(resultBuilder));
		resultBuilder = [];
		//*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
	} catch (e) {
		console.log(e);
	}
}
engine();
module.exports = engine;