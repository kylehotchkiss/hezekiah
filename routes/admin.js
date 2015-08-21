module.exports = function() {
    this.actions = {
        login: function( req, res ) {
            passport.authenticate('local', { successRedirect: '/', failureRedirect: '/', failureFlash: true });
        }
    };
};

/*exports.views.login
exports.views.home
exports.views.account
exports.views.indexIntegrations
exports.views.editIntegration
exports.views.indexUsers
exports.views.editUser
exports.views.viewUser
exports.views.indexCampaigns
exports.views.editCampaign
exports.views.viewCampaign
exports.views.indexSubcampaigns
exports.views.editSubcampaign
exports.views.viewSubcampaign


exports.actions.login
exports.actions.logout
exports.actions.editUser
exports.actions.editCampaign
exports.actions.editSubcampaign
exports.actions.editAccount
exprorts.actions.editIntegration*/
