Template.start.helpers({
    imNotInDraft: function (members) {
        if (!Meteor.user()) {
            return false;
        }
        return !isInDraft(members);
    },
    loggedIn: function () {
        if (Meteor.user()) {
            return true;
        } else {
            return false;
        }
    }
});

Template.start.rendered = function () {

    var draft = Drafts.find({ _id: Session.get("currentDraftId") });
    draft.observeChanges({
        changed: function (id, fields) {
            if (fields.started) {
                Router.go('draft', {_id: Session.get("currentDraftId") });
            }
        }
    });
};

var userEmail = function () {
    var user = Meteor.user();
    if (user && user.emails) {
        return user.emails[0].address;
    }

    return undefined;
};

var userId = function () {
    var user = Meteor.user();
    if (user && user._id) {
        return user._id;
    }

    return undefined;
};

var isInDraft = function (members) {
    var email = userEmail();
    if (members && members.length && email) {
        for (var i=0;i<members.length;i++) {
            var memb = members[i];
            if (memb.email === email) {
                return true;
            }
        }
    }

    return false;
};

Template.start.events({
    "click .join": function (e,t) {
        if (userEmail()) {
            member = {
                email: userEmail(),
                _id: userId()
            };

            Drafts.update({ "_id": this._id }, { $addToSet: { members: member }});
        }
    },
    "click .start": function (e,t) {
        var myId = this._id;
        startDraft(myId, function () {
            Router.go('draft', {_id: myId});
        });
    }
});

var shuffle = function (array) {
    var currentIndex = array.length, temporaryValue, randomIndex ;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
};

var startDraft = function (draftId, callback) {

    var draft = Drafts.findOne({ "_id": draftId });

    if (!draft) { return; }

    var mbrs = draft.members;

    shuffle(mbrs);

    Drafts.update({ "_id": draftId },{ $set: { currentBooster: 0, picked: [],  members: mbrs, started: true, finished: false } });

    Meteor.call("generateBoosters", draftId, true);

    callback();
};

