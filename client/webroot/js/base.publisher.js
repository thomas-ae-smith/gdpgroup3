(function (root) {
	"use strict";

	var sample = {
		adverts: [
			{ id: 1, title: "Guinness", type: "video", url: "ad-guinness.mp4", thumbnail: "", overlay: "<b>this is a test</b>" },
			{ id: 2, title: "Go Compare", type: "video", url: "ad-gocompare.mp4", thumbnail: "", overlay: "" },
			{ id: 3, title: "Just Dance", type: "video", url: "ad-justdance.mp4", thumbnail: "", overlay: "" },
			{ id: 4, title: "Blah blah", type: "video", url: "", thumbnail: "", overlay: "" },
			{ id: 5, title: "SUSU Nightlife", type: "still", url: "img/nightlife-sloth.jpg", duration: 3000, overlay: "" },
			{ id: 6, title: "SUSU Nightlife", type: "still", url: "img/nightlife-sloth.png", duration: 3000, overlay: "" },
			{ id: 7, title: "SUSU Nightlife", type: "still", url: "img/nightlife-sloth.png", duration: 3000, overlay: "" },
			{ id: 8, title: "SUSU Nightlife", type: "still", url: "img/nightlife-sloth.png", duration: 3000, overlay: "" }
		],
		campaigns: [
			{ advertId: 1, title: "Campaign 1" }
		]
	};


	var y4p = root.y4p = {
		templates: {},
		pages: {}
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

	y4p.AdvertiserApp = Backbone.View.extend({
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
			var that = this,
				view = new y4p.pages.AdvertList({ adverts: this.adverts });
			view.on("select", function (id) {
				that.router.navigate("adverts/" + id, { trigger: true });
			}, this);
			return this.render(view);
		},
		goAdvert: function (id) {
			var advert = this.adverts.get(id);
			return this.render(new y4p.pages.AdvertFull({ advert: advert }));
		},
		goCampaigns: function () {
			return this.render(new y4p.pages.CampaignList({ campaigns: this.campaigns }));
		},
		goCampaign: function (id) {
			var campaign = this.campaigns.get(id);
			return this.render(new y4p.pages.CampaignFull({ campaign: campaign }));
		},
		home: function () {
			return this.render(new y4p.pages.Home());
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

			page.on("change", function () {
				that.render(page);
			});

			if (this.page) {
				this.page.close();
			}
			this.page = page;
			return this;
		},
		start: function () {
			Backbone.history.start();
			return this;
		}
	});

	y4p.Page = Backbone.View.extend({
		close: function () {
			this.off().remove();
		}
	})

	y4p.pages.Home = y4p.Page.extend({
		title: "Home",
		render: function () {
			this.$el.html(y4p.templates.home());
			return this;
		}
	});

	y4p.pages.AdvertList = y4p.Page.extend({
		title: "Adverts",
		className: "advert-list",
		initialize: function (options) {
			this.adverts = options.adverts;
			this.adverts.on("add", this.add, this)
				.on("remove", this.remove, this);
			this.$items = [];
		},
		render: function () {
			this.$el.html(y4p.templates["advert-list"]());
			console.log(this.adverts)
			this.adverts.each(this.add, this);
			return this;
		},
		add: function (advert) {
			var that = this,
				$item = $(y4p.templates["advert-list-item"](advert.toJSON()));
			this.$items[advert.id] = $item;
			this.$(".list").append($item.fadeIn(200));
			$item.find(".edit").click(function () {
				that.trigger("select", advert.id);
			}).end().find(".delete").click(function () {
				that.adverts.remove(advert);
			});
		},
		remove: function (advert) {
			this.$items[advert.id].fadeOut(200, function () {
				$(this).remove();
			});
			delete this.$items[advert.id];
		}
	});

	y4p.pages.AdvertFull = y4p.Page.extend({
		events: {
			"change #advert-overlay": "updatePreview",
			"keyup #advert-overlay": "updatePreview",
		},
		initialize: function (options) {
			this.advert = options.advert;
			this.title = "Advert: " + this.advert.get("title");
		},
		render: function () {
			this.$el.html(y4p.templates["advert-full"](this.advert.toJSON()));
			return this;
		},
		updatePreview: _.throttle(function () {
			console.log("HJ")
			console.log(this.$("#advert-overlay-iframe"))
			this.$("#advert-overlay-iframe")[0].contentWindow.update(this.$("#advert-overlay").val());
		}, 500)
	});

	y4p.pages.CampaignList = y4p.Page.extend({
		title: "Campaigns",
		render: function () {
			this.$el.html(y4p.templates["campaign-list"]());
			return this;
		}
	});

	y4p.pages.CampaignFull = y4p.Page.extend({
		initialize: function (options) {
			this.campaign = options.campaign;
			this.title = "Campaign: " + this.campaign.get("title");
		},
		render: function () {
			this.$el.html(y4p.templates["campaign-full"]());
			return this;
		}
	});

	y4p.OverlayApp = Backbone.View.extend({
		initialize: function () {
			this.adverts = new y4p.Adverts(sample.adverts);
		},
		render: function () {
			return this;
		},
		start: function () {
			var advert = this.adverts.get(Number(window.location.hash.substr(1)));
			$("body").html(advert.get("overlay"));
			window.update = function (html) {
				$("body").html(html);
			}
			return this;
		}
	})

}(this))