(function (root) {
	var sample = {
		adverts: [
			{ id: 1, name: "Guinness", type: "video", url: "ad-guinness.mp4", thumbnail: "", overlay: "" },
			{ id: 2, name: "Go Compare", type: "video", url: "ad-gocompare.mp4", thumbnail: "", overlay: "" },
			{ id: 3, name: "Just Dance", type: "video", url: "ad-justdance.mp4", thumbnail: "", overlay: "" },
			{ id: 4, name: "Blah blah", type: "video", url: "", thumbnail: "", overlay: "" },
			{ id: 5, name: "SUSU Nightlife", type: "still", url: "img/nightlife-sloth.jpg", duration: 3000, overlay: "" },
			{ id: 6, name: "SUSU Nightlife", type: "still", url: "img/nightlife-sloth.png", duration: 3000, overlay: "" },
			{ id: 7, name: "SUSU Nightlife", type: "still", url: "img/nightlife-sloth.png", duration: 3000, overlay: "" },
			{ id: 8, name: "SUSU Nightlife", type: "still", url: "img/nightlife-sloth.png", duration: 3000, overlay: "" }
		],
		campaigns: [
			{ advertId: 1, name: "Campaign 1" }
		]
	};


	var y4p = root.y4p = {
		templates: {}
	};

	y4p.cacheTemplates = function () {
		_.each($("#templates > script"), function (el) {
			var $el = $(el);
			y4p.templates[$el.attr("id").replace("-template", "")] = _.template($el.html());
		});
	}


	y4p.Router = Backbone.Router.extend({
		routes: {
			"": "home",
			"adverts": "adverts",
			"adverts/:id": "advert",
			"campaigns": "campaigns",
			"campaigns/:id": "campaign"
		},
		initialize: function (options) { this.app = options.app; },
		home: function () { this.app.home(); },
		adverts: function () { this.app.goAdverts(); },
		advert: function (id) { this.app.goAdvert(id); },
		campaigns: function () { this.app.goCampaigns(); },
		campaign: function (id) { this.app.goCampaign(id); }
	});

	y4p.Adverts = Backbone.Collection.extend({});
	y4p.Campaigns = Backbone.Collection.extend({});

	y4p.App = Backbone.View.extend({
		className: "app",
		links: [
			{ title: "Home", hash: "" },
			{ title: "Adverts", hash: "adverts"  },
			{ title: "Campaigns", hash: "campaigns"  }
		],
		initialize: function () {
			this.router = new y4p.Router({ app: this });
			this.adverts = new y4p.Adverts(sample.adverts);
			this.campaigns = new y4p.Campaigns(sample.campaigns);
		},
		goAdverts: function () {
			return this.render("Adverts", new y4p.AdvertList({ adverts: this.adverts }));
		},
		goAdvert: function (id) {
			var advert = this.adverts.get(id);
			return this.render("Advert: " + advert.get("title"), new y4p.AdvertFull({ advert: advert }));
		},
		goCampaigns: function () {
			return this.render("Campaigns" + new y4p.CampaignList({ campaigns: this.campaigns }));
		},
		goCampaign: function (id) {
			var campaign = this.campaigns.get(id);
			return this.render("Campaign: " + campaign.get("title"), new y4p.CampaignFull({ campaign: campaign }));
		},
		home: function () {
			return this.render("Home", new y4p.Home());
		},
		render: function (title, view) {
			var currHash = window.location.hash.substr(1),
				links = _.map(this.links, function (_link) {
					var link = _.clone(_link);
					if (link.hash === currHash || (link.hash.length > 0 && currHash.indexOf(link.hash) === 0)) {
						link.active = true;
					}
					return link;
				}),
				breadcrumb = _.chain(currHash.split("/")).map(function (part) {
					var link = _.where(links, { hash: part });
					return (!link || link[0].hash === "") ? null : link[0];
				}).reject(function (link) {
					return link === null;
				}).value();
			breadcrumb.unshift(_.where(links, { hash: "" })[0]);
			this.$el.html(y4p.templates.main({
				title: title,
				links: links,
				breadcrumb: breadcrumb
			})).find(".main-body").append(view.render().el);
			return this;
		},
		start: function () {
			Backbone.history.start();
			//this.router.navigate("", { trigger: true });
			return this;
		}
	});

	y4p.Home = Backbone.View.extend({
		render: function () {
			this.$el.html(y4p.templates.home());
			return this;
		}
	});

	y4p.AdvertList = Backbone.View.extend({
		className: "advert-list",
		initialize: function (options) {
			this.adverts = options.adverts;
			this.adverts.on("add", this.add, this)
				.on("remove", this.remove, this);
		},
		render: function () {
			this.$el.html("");
			_.each(this.adverts, this.add, this);
			return this;
		},
		add: function () {

		},
		remove: function () {

		}
	});

	y4p.Advert = Backbone.View.extend({
		render: function () {
			this.$el.html(y4p.templates["advert-full"]());
			return this;
		}
	});

	y4p.CampaignList = Backbone.View.extend({
		render: function () {
			this.$el.html(y4p.templates["campaign-list"]());
			return this;
		}
	});

	y4p.Campaign = Backbone.View.extend({
		render: function () {
			this.$el.html(y4p.templates["campaign-full"]());
			return this;
		}
	});

	$(document).ready(function () {
		y4p.cacheTemplates();
		var app = new y4p.App();
		$(".container").append(app.start().el);
	});

}(this))