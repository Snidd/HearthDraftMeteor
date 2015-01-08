Router.route('/', function () {
    this.layout('AppLayout');
    this.render('Home', {
        data: function () { return Cards.find(); }
    });
});

Router.route('/draft/create', function () {
    this.render('Create');
    this.layout('AppLayout');
}, {
    name: 'draft.create'
});


Router.route('/draft/:_id/start', function () {
    var draft = Drafts.findOne({_id: this.params._id});
    this.render('Start', {data: function () {
        Session.set("currentDraftId", this.params._id);
        return draft;
    }});
    this.layout('AppLayout');
}, {
    name: 'draft.start'
});

Router.route('/draft/:_id/finished', function () {
    var draft = Drafts.findOne({_id: this.params._id});
    this.render('Finished', {data: function () {
        Session.set("currentDraftId", this.params._id);
        return draft;
    }});
    this.layout('AppLayout');
}, {
    name: 'draft.finished'
});


Router.route('/draft/:_id', function () {
    var draft = Drafts.findOne({_id: this.params._id});
    this.render('Draft', {data: function () {
        Session.set("currentDraftId", this.params._id);
        return draft;
    }});

    this.layout('AppLayout');
}, {
    name: 'draft'
});