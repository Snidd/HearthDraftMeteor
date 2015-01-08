Template.home.helpers({
    availableDrafts: function () {
        return Drafts.find( { started: false } );
        //return Drafts.find();
        // For now return all drafts so we can restart it.
    },
    draftsInProgress: function () {
        return Drafts.find( { started: true, finished: false });
    },
    finishedDrafts: function () {
        return Drafts.find( { finished: true });
    },
    percent: function (chance) {
        return chance*100 + "%";
    },
    moment: function (date) {
        return moment(date).fromNow()
    }
});