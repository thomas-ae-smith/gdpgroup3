
(function(y4) {
	"use strict";

	y4.RegisterView = Backbone.View.extend({

		regFields: ["name","gender","dob","email","occupation_id","password"],
		events: {
			"change .register-form input": "changeField",
			"change .register-form select": "changeField",
			"click .submit-registration": "submitReg"
		},

		className: "logon-outer",

		initialize: function (options) {
			var that = this;
			this.app = options.app;
			this.user = this.app.users.first() || new y4.User();
			this.occupations = new y4.Occupations();
		},

		render: function() {
			var that = this,
				registerTemplate = _.template($('#register-template').html());

			if (this.user && this.user.get('facebookId') != null) {
				this.regFields.pop();
			}

			var toRequest = _.filter(this.regFields, function(field) {
				field = that.user.get(field);
				if (field == null || typeof(field) === 'undefined') {
					return true;
				}
			});

			this.$el.html(registerTemplate({
				user: this.user.toJSON(),
				req: toRequest,
				fields: this.regFields,
				occupations: this.occupations
			}));

			this.occupations.fetch().then(function() {
				var occSelect = that.$('.register-form :input[name="occupation_id"]');
				that.occupations.each(function(occupation) {
					occSelect.append($('<option>', {value: occupation.get('id')}).text(capitalize(occupation.get('name'))));
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
			this.app.users.register(this.user.toJSON()).done(function () {
				that.$('.error').hide();
				that.trigger("registered");
			}).fail(function () {
				that.$('.error').show().html(JSON.parse(response.responseText).error); // FIXME
			});
		}
	});

	y4.LoginView = Backbone.View.extend({
		className: "logon-outer",
		events: {
			"click .facebook-button": "facebookLogin",
			"click .login-button": "normalLogin",
			"click .register-button": "register"
		},

		initialize: function (options) {
			this.app = options.app;
		},

		setUser: function(user, existingSession) {
			this.trigger("setUser", user, existingSession);
		},

		facebookLogin: function() {
			var that = this;
			this.$('.facebook-button').attr('disabled', 'disabled')
				.text("Please wait...");

			this.app.users.loginFB().done(function () {
				that.$('.error').hide();
				that.trigger("loggedIn");
			}).fail(function (msg) {
				that.$('.error').show().html(msg);
			});
		},

		register: function () {
			this.app.router.navigate("register", { trigger: true });
		},

		normalLogin: function () {
			var that = this,
				email = $('#inputEmail').val(),
				password = $('#inputPassword').val();

			this.app.users.login(email, password).done(function () {
				that.$('.error').hide();
				that.trigger("loggedIn");
			}).fail(function (response) {
				that.$('.error').show().html(JSON.parse(response.responseText).error);
			});
		},

		render: function() {
			var loginTemplate = y4.templates['login'];
			this.$el.html(loginTemplate());
			return this;
		},

	});

}(this.y4));
