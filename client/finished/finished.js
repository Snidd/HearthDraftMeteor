Template.finished.helpers({
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
                if (a.mana === b.mana) {
                    if(a.name < b.name) return -1;
                    if(a.name > b.name) return 1;
                    return 0;
                }
                return Number(a.mana) - Number(b.mana);
            });
        }
        return picks;
    }
});