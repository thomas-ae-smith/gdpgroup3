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

	y4p.Adverts = Backbone.Collection.extend({
		url: "http://www.your4.tv/api/adverts/"
	});
	y4p.Campaign = Backbone.Model.extend({
		initialize: function () {
			var that = this;
			this.targetCollections = {};
			_.each(this.get("targets"), function (targets, type) {
				that.targetCollections[type] = new y4p.CampaignTargets(targets, { url: that.url() + "/targets/" + type + "/" });
			});
			console.log(this.targetCollections)
		}
	});
	y4p.Campaigns = Backbone.Collection.extend({
		model: y4p.Campaign,
		url: "http://www.your4.tv/api/campaigns/"
	});

	y4p.CampaignTargets = Backbone.Collection.extend({
		initialize: function (items, options) {
			this.url = options.url;
		}
	});

	y4p.AdvertiserApp = Backbone.View.extend({
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
			}, this);
			return this.render(view);
		},
		goAdvert: function (id) {
			var that = this,
				advert = this.adverts.get(id),
				view = new y4p.pages.AdvertFull({ advert: advert, app: this });
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
			});
			return this.render(view);
		},
		goCampaign: function (id) {
			var campaign = this.campaigns.get(id);
			return this.render(new y4p.pages.CampaignFull({ campaign: campaign, app: this }));
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
			var that = this;
			$.when(this.adverts.fetch(), that.campaigns.fetch()).then(function () {
				Backbone.history.start();
			});
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

	y4p.pages.List = y4p.Page.extend({
		initialize: function (options) {
			if (options.collection) {
				this.collections = [options.collection]
			} else if (options.collections) {
				this.collections = options.collections;
			}
			var that = this;
			_.each(this.collections, function (collection) {
				collection.on("addItem", that.add, that)
					.on("removeItem", that.remove, that);
			});
			this.$items = [];
		},
		render: function () {
			var that = this;
			this.$el.html(y4p.templates[this.template]());
			_.each(this.collections, function (collection) {
				collection.each(function (model) {
					that.addItem(model, undefined, true);
				});
			});
			return this;
		},
		addItem: function (model, options, noAnimation) {
			var that = this,
				$item = $(y4p.templates[this.itemTemplate](_.extend(model.toJSON(), options)));
			this.$items[model.id] = $item;
			this.$(".list").append($item.fadeIn(noAnimation ? 0 : 200));
			$item.find(".edit").click(function () {
				that.trigger("select", model.id);
			}).end().find(".delete").click(function () {
				that.collection.remove(model);
			});
			return this;
		},
		removeItem: function (model) {
			this.$items[model.id].fadeOut(200, function () {
				$(this).remove();
			});
			delete this.$items[model.id];
			return this;
		}
	})

	y4p.pages.AdvertList = y4p.pages.List.extend({
		title: "Adverts",
		className: "advert-list",
		template: "advert-list",
		itemTemplate: "advert-list-item"
	});

	y4p.pages.CampaignList = y4p.pages.List.extend({
		title: "Campaigns",
		className: "campaign-list",
		template: "campaign-list",
		itemTemplate: "campaign-list-item",
		addItem: function (model) {
			return y4p.pages.List.prototype.addItem.call(this, model, {
				advert: this.options.app.adverts.get(model.get("advert")).toJSON()
			});
		}
	});

	y4p.TargetList = y4p.pages.List.extend({
		className: "campaign-target-list",
		template: "campaign-target-list",
		itemTemplate: "campaign-target-list-item",
		addItem: function (model) {
			return y4p.pages.List.prototype.addItem.call(this, model, { type: "blah", details: JSON.stringify(model.toJSON()) });
		}
	});

	y4p.pages.AdvertFull = y4p.Page.extend({
		events: {
			"change #advert-overlay": "updatePreview",
			"keyup #advert-overlay": "updatePreview",
			"click .cancel": "cancel",
			"submit form": "submit"
		},
		initialize: function (options) {
			this.advert = options.advert;
			this.title = "Advert: " + this.advert.get("title");
		},
		render: function () {
			var that = this;
			this.$el.html(y4p.templates["advert-full"](this.advert.toJSON()));
			setTimeout(function () { that.updatePreview(); }, 100); // Erm.. HACK
			return this;
		},
		updatePreview: _.throttle(function () {
			this.$("#advert-overlay-iframe")[0].contentWindow.update(this.$("#advert-overlay").val());
		}, 500),
		submit: function (e) {
			e.preventDefault();
			var that = this;
			this.advert.save({
				title: this.$("#advert-title").val(),
				//type: this
				overlay: this.$("#advert-overlay").val()
			}, {
				success: function () {
					that.$("form").html("Saved.");
				},
				error: function () {
					that.$("form").prepend("Error saving")
				}
			});
		},
		cancel: function () {
			this.trigger("return");
		}
	});


	y4p.pages.CampaignFull = y4p.Page.extend({
		initialize: function (options) {
			this.campaign = options.campaign;
			this.title = "Campaign: " + this.campaign.get("title");
		},
		render: function () {
			this.$el.html(y4p.templates["campaign-full"](_.extend({
				adverts: this.options.app.adverts
			}, this.campaign.toJSON())));

			var targetList = new y4p.TargetList({ collections: this.campaign.targetCollections });
			this.$("#advert-targets").append(targetList.render().el);

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