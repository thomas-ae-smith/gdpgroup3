
(function(y4) {
	"use strict";



	y4.RegisterView = Backbone.View.extend({

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

	y4.LoginView = Backbone.View.extend({
		className: "logon-outer",
		events: {
			"click .facebook-button": "facebookLogin",
			"click .register-button": "register"
		},

		initialize: function (options) {
			this.app = options.app;
		},

		facebookLogin: function() {
			var that = this;
			if (!this.facebookLoggedIn) {
				this.$('.facebook-button').attr('disabled', 'disabled')
					.text("Please wait...");
				this.app.fbLogin().then(function () {
					that.$('.facebook-button').removeAttr('disabled')
						.text("Login with Facebook");
				});
			}
		},

		register: function () {
			this.app.router.navigate("register", { trigger: true });
		},

		login: function () {
			var user = new User({
				email: $("#inputEmail").val(),
				password: $("#inputPassword").val() // or whatever
			});
			// ...
		},

		render: function() {
			var loginTemplate = y4.templates['login'];
			this.$el.html(loginTemplate());
			return this;
		}
	});

}(this.y4));
