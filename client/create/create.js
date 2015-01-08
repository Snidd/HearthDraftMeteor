var allClasses = ["Druid", "Hunter", "Mage", "Paladin", "Priest", "Rogue", "Shaman", "Warlock", "Warrior"];

var defaults = {
    totals: 15,
    classchance: 0.4,
    boosters: 3
};

Template.create.helpers({
    classes: allClasses,
    addedClass: function (className) {
        if (isAdded(className)) {
            return "btn-primary";
        } else {
            return "btn-default";
        }
    },
    addedIcon: function (className) {
        if (isAdded(className)) {
            return "fa-trash";
        } else {
            return "fa-plus";
        }
    },
    totals: defaults.totals,
    classchance: defaults.classchance,
    boosters: defaults.boosters
});

Template.create.created = function () {
    for (var i=0;i<allClasses.length;i++) {
        Session.set(allClasses[i], true);
    }
};


Template.create.events({
    "click .classbtn": function (e, t) {
        toggleClass(this.toString());
    },
    "submit #createdraft": function (e, t) {
        e.preventDefault();

        var data = SimpleForm.processForm(e.target);

        var draft = {
            totals: defaults.totals,
            classchance: defaults.classchance,
            boosters: defaults.boosters,
            now: new Date().toJSON(),
            classes: [],
            started: false
        };

        for (var i=0;i<allClasses.length;i++) {
            if (isAdded(allClasses[i])) {
                draft.classes.push(allClasses[i]);
            }
        }

        if (data.totals && data.totals > 0) {
            draft.totals = Number(data.totals);
        }

        if (data.classchance && data.classchance > 0) {
            draft.classchance = Number(data.classchance);
        }

        if (data.boosters && data.boosters > 0) {
            draft.boosters = Number(data.boosters);
        }

        Drafts.insert(draft);

        Router.go('/');

        console.log(draft);

        return false;
    }
});

var isAdded = function (className) {
    return Session.get(className);
};

var toggleClass = function (className) {
    if (Session.get(className)) {
        Session.set(className, false);
    } else {
        Session.set(className, true);
    }
};