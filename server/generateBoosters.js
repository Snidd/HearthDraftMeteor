Meteor.methods({
    "generateBoosters": function (draftId, cleanDraft) {
        createBoosters(draftId, cleanDraft);
    },
    "makePick": function (card, draftId) {

        var booster = Boosters.findOne({ draftId: draftId, ownerId: Meteor.userId() });
        Boosters.update({ _id: booster._id }, { $set: { picked: card } });

        var draft = Drafts.findOne({ _id: draftId });

        if (!draft) { return; }

        Drafts.update({ _id: draftId }, { $push: { picked: Meteor.userId() } });

        var members = draft.members;

        var allPicked = true, i;

        var picked = [];

        for (i=0;i<members.length;i++) {
            var member = members[i];
            var booster = Boosters.findOne({ draftId: draftId, ownerId: member._id });
            if (booster.picked === undefined) {
                allPicked = false;
                break;
            } else {
                picked.push(member);
            }
        }

        if (!allPicked) {
            return;
        }

        var cardsLeft = 0;

        for (i=0;i<members.length;i++) {
            var member = members[i];
            var booster = Boosters.findOne({ draftId: draftId, ownerId: member._id });
            var pickedCard = booster.picked;

            console.log("Removing:" + pickedCard.name);

            Boosters.update({ _id: booster._id }, { $unset: { picked: "" }, $pull: { cards: { _id: pickedCard._id } } });
        }

        var boostersToUpdate = [];

        for (i=0;i<members.length;i++) {
            var member = members[i];
            var booster = Boosters.findOne({draftId: draftId, ownerId: member._id});
            boostersToUpdate.push(booster);
        }

        for (i=0;i<boostersToUpdate.length;i++) {
            var booster = boostersToUpdate[i];

            cardsLeft = booster.cards.length;

            var nextMember = i + 1;

            if (nextMember > members.length - 1) {
                nextMember = 0;
            }
            var nextOwnerId = members[nextMember]._id;
            var nextOwnerEmail = members[nextMember].email;

            console.log("Giving booster (" + booster._id + " from:" + member.email + " to " + nextOwnerEmail);

            Boosters.update({_id: booster._id}, {$set: {ownerId: nextOwnerId}});

        }

        Drafts.update({ _id: draftId }, { $set: { picked: [] } });

        console.log("Cards left:" + cardsLeft);

        if (cardsLeft === 0) {
            createBoosters(draftId);
        }


    }
});

var createBoosters = function (draftId, cleanDraft) {
    if (cleanDraft) {
        Boosters.remove({ draftId: draftId });
        Picks.remove({ draftId: draftId });
    } else {
        Boosters.remove({ draftId: draftId });
    }

    var draft = Drafts.findOne({ _id: draftId });

    draft.currentBooster++;

    if (draft.currentBooster > draft.boosters) {
        Drafts.update({ _id: draft._id }, { $set: { finished: true } });
    } else {
        Drafts.update({ _id: draft._id }, { $set: { currentBooster: draft.currentBooster } });

        for (var i=0;i<draft.members.length;i++) {
            var cards = generateNewBooster(draft.totals, draft.classchance, draft.classes);
            var booster = { draftId: draftId, ownerId: draft.members[i]._id, cardspicked: [], cards: cards };
            Boosters.insert(booster);

        }
    }
};

var generateNewBooster = function (totalCards, classCardPercentage, classes) {

    var totalCards;

    var commonsClasses = Cards.find({ draftable: true, rarity: { $in: [ "Common", "Free" ] } , class: { $in: classes } }).fetch();
    var raresClasses = Cards.find({ draftable: true, rarity: "Rare", class: { $in: classes } }).fetch();
    var epicsClasses = Cards.find({ draftable: true, rarity: "Epic", class: { $in: classes } }).fetch();

    classes.push(undefined);

    var commons = Cards.find({ draftable: true, rarity: { $in: [ "Common", "Free" ] } , class: undefined }).fetch();
    var rares = Cards.find({ draftable: true, rarity: "Rare", class: undefined }).fetch();
    var epics = Cards.find({ draftable: true, rarity: "Epic", class: undefined }).fetch();
    var legendaries = Cards.find({ draftable: true, rarity: "Legendary", class: { $in: classes } }).fetch();

    // 5% legendaries
    var legendaryCount = getCardCount(totalCards, 0.05);

    // 15% epics
    var epicCount = getCardCount(totalCards,  0.15);
    // 30% rares
    var rareCount = getCardCount(totalCards, 0.30);

    var cardIdsAdded = [], rand, card;

    // rest commons
    var commonCount = totalCards - legendaryCount - epicCount - rareCount;

    var i, booster = [], classcardsAdded = 0, neutralsAdded = 0;

    for (i=0;i<legendaryCount;i++) {
        var card = getCard(legendaries, cardIdsAdded);
        cardIdsAdded.push(card._id);
        booster.push(card);
    }

    for (i=0;i<epicCount;i++) {
        rand = Math.random();
        if (rand < classCardPercentage) {
            card = getCard(epicsClasses, cardIdsAdded);
        } else {
            card = getCard(epics, cardIdsAdded);
        }
        if (card.class !== undefined) {
            classcardsAdded++;
        } else {
            neutralsAdded++;
        }
        cardIdsAdded.push(card._id);
        booster.push(card);
    }

    for (i=0;i<rareCount;i++) {
        rand = Math.random();
        if (rand < classCardPercentage) {
            card = getCard(raresClasses, cardIdsAdded);
        } else {
            card = getCard(rares, cardIdsAdded);
        }

        if (card.class !== undefined) {
            classcardsAdded++;
        } else {
            neutralsAdded++;
        }
        cardIdsAdded.push(card._id);
        booster.push(card);
    }

    for (i=0;i<commonCount;i++) {
        rand = Math.random();
        if (rand < classCardPercentage) {
            card = getCard(commonsClasses, cardIdsAdded);
        } else {
            card = getCard(commons, cardIdsAdded);
        }

        //console.log(neutralsAdded + " - " + classcardsAdded);
        //console.log(commons.length + " - " + commonsClasses.length);
        if (card.class !== undefined) {
            classcardsAdded++;
        } else {
            neutralsAdded++;
        }
        cardIdsAdded.push(card._id);
        booster.push(card);
    }

    return booster;
};

var getCard = function (cardsArray, idsPicked) {

    var rand = getRandomNumber(1, cardsArray.length-1);
    var card = cardsArray[rand];
    while (idInArray(card._id, idsPicked)) {
        rand = getRandomNumber(1, cardsArray.length-1);
        card = cardsArray[rand];
    }
    return card;
};

var idInArray = function (cardId, idArray) {
    for (var i=0;i<idArray.length;i++) {
        if (cardId === idArray[i]) {
            return true;
        }
    }
    return false;
};


var getCardCount = function (totalCards, percentChance) {
    var cardCount = totalCards * percentChance;
    var decimal = cardCount % 1;
    var rand = Math.random();
    cardCount = Math.floor(cardCount);
    if (rand < decimal) {
        cardCount++;
    }

    return cardCount;
};

var getRandomNumber = function (min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
};