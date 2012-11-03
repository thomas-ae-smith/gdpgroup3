(function (y4) {
	"use strict";
	y4p.Router = Backbone.Router.extend({
		routes: {
			"": "home",
			"adverts": "adverts",
			"adverts/:id": "advert",
			"campaigns": "campaigns",
			"campaigns/:id": "campaign",
			"*notFound": "notFound" // http://stackoverflow.com/questions/11236338/is-there-a-way-to-catch-all-non-matched-routes-with-backbone
		},
		initialize: function (options) { this.app = options.app; },
		home: function () { this.app.home(); },
		adverts: function () { this.app.goAdverts(); },
		advert: function (id) { this.app.goAdvert(id); },
		campaigns: function () { this.app.goCampaigns(); },
		campaign: function (id) { this.app.goCampaign(id); },
		notFound: function () {
			this.app.render(new y4p.pages.NotFound({ message: "Page not found." }));
		}

	});

	y4p.App = Backbone.View.extend({
		className: "app",
		links: [
			{ title: "Home", hash: "" },
			{ title: "Adverts", hash: "adverts"  },
			{ title: "Campaigns", hash: "campaigns"  }
		],
		initialize: function () {
			this.router = new y4p.Router({ app: this });
			this.adverts = new y4p.Adverts();
			this.campaigns = new y4p.Campaigns(undefined, { adverts: this.adverts });
		},
		goAdverts: function () {
			var that = this,
				view = new y4p.pages.AdvertList({ collection: this.adverts, app: this });
			view.on("select", function (id) {
				that.router.navigate("adverts/" + id, { trigger: true });
			}).on("create", function () {
				that.router.navigate("adverts/new", { trigger: true })
			});
			return this.render(view);
		},
		goAdvert: function (id) {
			var that = this,
				advert = id === "new" ? new y4p.Advert() : this.adverts.get(id),
				view = advert ?
					new y4p.pages.AdvertFull({ advert: advert, app: this }) :
					new y4p.pages.NotFound({ message: "Advert not found." });
			view.on("return", function () {
				that.router.navigate("adverts", { trigger: true });
			});
			return this.render(view);
		},
		goCampaigns: function () {
			var that = this,
				view = new y4p.pages.CampaignList({ collection: this.campaigns, app: this });
			view.on("select", function (id) {
				that.router.navigate("campaigns/" + id, { trigger: true })
			}).on("create", function () {
				that.router.navigate("campaigns/new", { trigger: true })
			});
			return this.render(view);
		},
		goCampaign: function (id) {
			var that = this,
				campaign = id === "new" ? new y4p.Campaign() : this.campaigns.get(id),
				view = campaign ?
					new y4p.pages.CampaignFull({ campaign: campaign, app: this }) :
					new y4p.pages.NotFound({ message: "Campaign not found." });
			view.on("return", function () {
				that.router.navigate("campaigns", { trigger: true });
			});
			return this.render(view);
		},
		home: function () {
			return this.render(new y4p.pages.Home({ app: this }));
		},
		render: function (page) {
			var that = this,
				currHash = window.location.hash.substr(1),
				links = _.map(this.links, function (_link) {
					var link = _.clone(_link);
					if (link.hash === currHash || (link.hash.length > 0 && currHash.indexOf(link.hash) === 0)) {
						link.active = true;
					}
					return link;
				}),
				breadcrumb = _.chain(currHash.split("/")).map(function (part) {
					var link = _.where(links, { hash: part });
					return (!link.length || link[0].hash === "") ? null : link[0];
				}).reject(function (link) {
					return link === null;
				}).value();

			breadcrumb.unshift(_.where(links, { hash: "" })[0]);
			this.$el.html(y4p.templates.main({
				title: page.title,
				links: links,
				breadcrumb: breadcrumb,
				sublinks: page.sublinks
			})).find(".main-body").append(page.render().el);
			window.title = "Your 4 - " + page.title;

			page.on("change", function () {
				that.render(page);
			}).on("title", function (title) {
				that.$(".title").html("Your 4 - " + title);
				window.title = title;
			});

			if (this.page) {
				this.page.close();
			}
			this.page = page;
			return this;
		},
		start: function () {
			var that = this;
			$.when(this.adverts.fetch(), that.campaigns.fetch()).then(function () {
				Backbone.history.start();
			}).fail(function () {
				that.$el.html('<div class="alert alert-error" style="width: 700px; margin: 40px auto;"><b>Error while loading page.</b></div>')
			});
			return this;
		}
	});

}(this.y4));
