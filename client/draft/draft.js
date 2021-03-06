Template.draft.helpers({
    "availablePicks": function () {
        var booster = Boosters.findOne({ draftId: this._id, ownerId: Meteor.userId() });
        if (booster) {
            return booster.cards;
        }
    },
    playersRemaining: function () {
        var draft = Drafts.findOne({ _id: Session.get("currentDraftId")});
        if (!draft || !draft.members || !draft.picked) { return; }
        var remaining = draft.members.length - draft.picked.length;
        return remaining + " player(s) not picked...";

    },
    cardClass: function (card) {
        var booster = getCurrentBooster();
        if (booster === undefined) {
            return;
        }
        if (booster.picked !== undefined && booster.picked._id !== card._id) {
            return "unavailable"
        }
        if (Session.get("selectedCard") === card._id) {
            return "selected";
        }
        return "";
    },
    isSelected: function (card) {
        return Session.get("selectedCard") === card._id;
    },
    moreThenOne: function (card) {
        return card.count > 1;
    },
    hasPicks: function () {
        var picks = Picks.find({ draftId: Session.get("currentDraftId"), ownerId: Meteor.userId() }).count();
        return picks > 0;
    },
    picks: function () {
        var p = Picks.findOne({ draftId: Session.get("currentDraftId"), ownerId: Meteor.userId() });
        var picks = p.picks;
        var ids = {};
        for (var i=0;i<picks.length;i++) {
            var p = picks[i];
            if (ids[p._id]) {
                picks[ids[p._id]].count++;
                picks[i].count = 0;
            } else {
                picks[i].count = 1;
                ids[p._id] = i;
            }
        }

        for (var i=0;i<picks.length;i++) {
            if (picks[i].count === 0) {
                picks.splice(i, 1);
                i--;
            }
        }

        if (picks) {
            picks.sort(function (a,b) {
                if (a.class === undefined) {
                    a.class = "ANeutral;"
                }
                if (b.class === undefined) {
                    b.class = "ANeutral;"
                }
                if (a.class === b.class) {
                    if (a.mana === b.mana) {
                        if(a.name < b.name) return -1;
                        if(a.name > b.name) return 1;
                        return 0;
                    }
                    return Number(a.mana) - Number(b.mana);
                } else {
                    if (a.class < b.class) return -1;
                    if (a.class > b.class) return 1;
                    return 0;
                }

            });
        }
        return picks;
    }
});

var getCurrentBooster = function () {
    return Boosters.findOne({ draftId: Session.get("currentDraftId"), ownerId: Meteor.userId() });
};

Template.draft.rendered = function () {

    var draft = Drafts.find({ _id: Session.get("currentDraftId") });
    draft.observeChanges({
        changed: function (id, fields) {
            if (fields.finished) {
                Router.go('draft.finished', {_id: Session.get("currentDraftId") });
            }
        }
    });
};


Template.draft.events({
   "click .card": function () {
       var booster = getCurrentBooster();
       if (booster.picked !== undefined) {
           return;
       }
       Session.set("selectedCard", this._id);
   },
    "click .pickcard": function () {

        Session.set("selectedCard", undefined);

        Meteor.call("makePick", this, Session.get("currentDraftId"));
    }
});