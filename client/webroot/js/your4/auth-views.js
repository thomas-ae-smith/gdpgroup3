
(function(y4) {
	"use strict";



	y4.Register = Backbone.View.extend({

		regFields: ["name","gender","dob","email","occupation","password"],
		events: {
			"change .register-form input": "changeField",
			"change .register-form select": "changeField",
			"click .submit-registration": "submitReg"
		},

		className: "logon-outer",

		initialize: function() {
			var that = this;
			this.user = this.options.user;
			if (!this.user) {
				this.userCollection = new y4.Users();
				this.user = new y4.User();
				this.userCollection.add(this.user);
			}

			this.occupations = new y4.OccupationCollection();

		},

		render: function() {
			var registerTemplate = _.template($('#register-template').html());

			if (this.user.get('facebookId') != null) {
				this.regFields.pop();
			}

			var that = this;
			var toRequest = _.filter(this.regFields, function(field) {
				field = that.user.get(field);
				if (field == null || typeof(field) === 'undefined') {
					return true;
				}
			});

			this.$el.html(registerTemplate({user: this.user.toJSON(), req: toRequest, fields: this.regFields, occupations: this.occupations}));
			this.occupations.fetch().then(function() {
				var occSelect = $('.register-form :input[name="occupation"]');
				that.occupations.each(function(occupation) {
					occSelect.append($('<option>', {value: occupation.get('id')}).text(occupation.get('name')));
				});
			});

			return this;
		},

		changeField: function(e) {
			var target = $(e.currentTarget);
			this.user.set(target.attr('name'),target.val());
		},

		submitReg: function() {
			var that = this;
			this.user.save(undefined, {success: function() {
				y4.app.login.userModel = that.user;
				y4.app.start();
			}, error: function(model, response) {
				that.$el.prepend(response);
			}});
		}
	});

	y4.Login = Backbone.View.extend({
		className: "logon-outer",
		events: {
			"click .facebook-button": "facebookLogin",
			"click .register-button": "renderReg"
		},

		initialize: function() {
			_.bindAll(this, 'logout');
			this.userCollection = new y4.Users();
			var that = this;
			this.userModel = new y4.User({id: 'me'});
			this.userCollection.add(that.userModel);
			this.userModel.fetch({success: function() {
				y4.app.start();
			}, error: function() {
				FB.getLoginStatus(function(response) {
					if (response.status === 'connected') {
						that.retrieveUser();
					} else if (response.status === 'not_authorized') {
						that.facebookLoggedIn = false;
						y4.app.hideSpinner();
						that.renderLogin();
					} else {
						that.facebookLoggedIn = false;
						y4.app.hideSpinner();
						that.renderLogin();
					}
				});
			}});
		},

		facebookLogin: function() {
			var that = this;
			if (!this.facebookLoggedIn) {
				$('.facebook-button').attr('disabled','disabled');
				$('.facebook-button').text("Please wait...");
				FB.login(function(response) {
					if (response.authResponse) {
						that.facebookLoggedIn = true;
						that.retrieveUser();
					}
				}, {scope: 'user_birthday,email'});
			}
		},

		// Crucial. Sets server side session and ensures user is registered.
		retrieveUser: function() {
			var that = this;
			FB.api('/me', function(response) {
				that.userModel = new y4.User({id: 'fb-'+response.id});
				that.userCollection.add(that.userModel);
				that.userModel.fetch().then(function() {
					if (that.userModel.get("registered")) {
						y4.app.start();
					} else {
						that.renderReg(undefined, that.userModel);
					}
					y4.app.hideSpinner();
				});
			});
		},

		renderReg: function(e, user) {
			var registerView = new y4.Register({user: user});
			$(".logo-frame").html(registerView.render().el);
		},

		logout: function() {
			this.userModel.destroy().then(function(response) {
				if (response == "success") {
					window.location = 'http://'+window.location.hostname;
				}
			});
		},

		render: function() {
			return this;
		},

		renderLogin: function() {
			var loginTemplate = _.template($('#login-template').html());
			this.$el.html(loginTemplate());
		}

	});

}(this.y4));
