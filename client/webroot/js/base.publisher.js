function htmlEscape(str) {
    return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
}

(function (root) {
	"use strict";

	var y4p = root.y4p = {
		templates: {},
		pages: {}
	};

	y4p.language = {
		advertType: {
			"video": "Video",
			"still": "Image"
		},
		type: {
			"ageRanges": "Age ranges",
			"boundingBoxes": "Locations",
			"occupations": "Occupations",
			"genres": "Genres",
			"programmes": "Programmes"
		}
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

	y4p.Advert = Backbone.Model.extend({
		defaults: { title: "", type: "", adverts: [], overlay: "" }
	});
	y4p.Adverts = Backbone.Collection.extend({
		model: y4p.Advert,
		url: "http://www.your4.tv/api/adverts/"
	});
	y4p.Campaign = Backbone.Model.extend({
		initialize: function () {
			var that = this;
			this.targetCollections = {};
			_.each(this.get("targets"), function (targets, type) {
				that.targetCollections[type] = new y4p.CampaignTargets(targets, { url: that.url() + "/targets/" + type + "/" });
			});
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
				that.router.navigate("campaign/new", { trigger: true })
			});
			return this.render(view);
		},
		goCampaign: function (id) {
			var that = this,
				campaign = this.campaigns.get(id),
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

	y4p.View = Backbone.View.extend({
		close: function () {
			this.off().remove();
		}
	})

	y4p.Page = y4p.View.extend({
		setTitle: function (title) {
			this.title = title;
			this.trigger("title", title);
		}
	})

	y4p.pages.Home = y4p.Page.extend({
		title: "Home",
		render: function () {
			this.$el.html(y4p.templates.home());
			return this;
		}
	});

	y4p.pages.NotFound = y4p.Page.extend({
		title: "Not found",
		render: function () {
			this.$el.html(y4p.templates.notfound(_.extend({ message: "Page cannot be found." }, this.options)));
			return this;
		}
	})

	y4p.List = y4p.View.extend({
		events: { "click .create": "create" },
		create: function () { this.trigger("create"); },
		initialize: function (options) {
			this.collection = options.collection
			this.collection.on("add", this.addItem, this)
				.on("remove", this.removeItem, this);
			this.$items = [];
		},
		render: function () {
			var that = this;
			this.$el.html(y4p.templates[this.template](this.options));
			this.collection.each(function (model) {
				that.addItem(model, undefined, true);
			});
			if (this.collection.length === 0) { this.$("tr").hide(); }
			return this;
		},
		addItem: function (model, options, noAnimation) {
			var that = this,
				$item = $(y4p.templates[this.itemTemplate](_.extend(model.toJSON(), options))),
				$list = this.$(".list");

			this.$("tr").show();
			if (!$list.length) { $list = this.$el; }
			this.$items[model.id] = $item;
			$list.append($item.fadeIn(noAnimation ? 0 : 200));
			$item.click(function () {
				that.trigger("select", model.id);
			}).find(".edit").click(function () {
				that.trigger("select", model.id);
			}).end().find(".delete").click(function (e) {
				if (confirm("Are you sure you wish to delete this advert?")) {
					model.destroy();
				}
				e.preventDefault();
				e.stopPropagation();
			});
			return this;
		},
		removeItem: function (model) {
			this.$items[model.id].fadeOut(200, function () {
				$(this).remove();
			});
			if (this.collection.length === 0) { this.$("tr").hide(); }
			delete this.$items[model.id];
			return this;
		}
	});

	y4p.SuperList = y4p.View.extend({
		events: { "click .create": "create" },
		create: function () { this.trigger("create"); },
		initialize: function (options) {
			var that = this;
			this.collections = options.collections;
			this.lists = _.map(this.collections, function (collection, type) {
				var SubList = y4p.List.extend({
					className: that.listClassName,
					template: that.listTemplate,
					itemTemplate: that.listItemTemplate
				});
				return new SubList({ collection: collection, type: type });
			});
		},
		render: function () {
			var that = this;
			this.$el.html(y4p.templates[this.template]());
			_.each(this.lists, function (list) {
				that.$(".list").append(list.render().$("tr"));
			});
			return this;
		}
	})

	y4p.pages.AdvertList = y4p.Page.extend(y4p.List.prototype).extend({
		title: "Adverts",
		className: "advert-list",
		template: "advert-list",
		itemTemplate: "advert-list-item"
	});

	y4p.pages.CampaignList = y4p.Page.extend(y4p.List.prototype).extend({
		title: "Campaigns",
		className: "campaign-list",
		template: "campaign-list",
		itemTemplate: "campaign-list-item",
		addItem: function (model) {
			return y4p.List.prototype.addItem.call(this, model, {
				adverts: _.map(model.get("advert"), function (advert) {
					return this.options.app.adverts.get(advert).toJSON()
				})
			});
		}
	});

	y4p.TargetList = y4p.SuperList.extend({
		template: "campaign-target-superlist",
		listClassName: "campaign-target-list",
		listTemplate: "campaign-target-list",
		listItemTemplate: "campaign-target-list-item"
	});

	y4p.pages.AdvertFull = y4p.Page.extend({
		className: "advert-full",
		events: {
			"click .cancel": "cancel",
			"click .submit": "submit"
		},
		initialize: function (options) {
			this.advert = options.advert;
			this.adverts = options.app.adverts;
			this.title = "Advert: " + this.advert.get("title");
		},
		render: function () {
			var that = this;
			this.$el.html(y4p.templates["advert-full"](this.advert.toJSON()));
			setTimeout(function () { that.updatePreview(); }, 100); // Erm.. HACK

			this.$('#advert-file').fileupload({
				dataType: 'json',
				add: function (e, data) {
					data.context = $('<p/>').text('Uploading...').appendTo(document.body);
					data.submit();
				},
				done: function (e, data) {
					that.advert.set({ url: data.result.url });
					console.log(that.advert.get("url"))
					console.log({ url: data.result.url })
				},
				progressall: function (e, data) {
					var progress = parseInt(data.loaded / data.total * 100, 10);
					console.log(progress)
					$('#progress .bar').css(
						'width',
						progress + '%'
					);
				}
			});

			this.overlayEditor = ace.edit(this.$("#advert-overlay .ace-container")[0]);
			this.overlayEditor.setTheme("ace/theme/monokai");
			this.overlayEditor.getSession().setMode("ace/mode/html");

			this.overlayEditor.getSession().on('change', function () {
				that.updatePreview();
			});

			return this;
		},
		updatePreview: _.throttle(function () {
			var update = this.$("#advert-overlay-iframe")[0].contentWindow.update;
			if (update) {
				update(this.overlayEditor.getValue());
			}
		}, 500),
		submit: function (e) {
			e.preventDefault();
			var that = this,
				attributes = {
					title: this.$("#advert-title").val(),
					type: this.$("#advert-type").val(),
					overlay: this.overlayEditor.getValue()
				},
				options = {
					success: function () {
						that.$("form").html("Saved.");
					},
					error: function () {
						that.$("form").prepend("Error saving")
					}
				};
			if (this.advert.has("id")) {
				this.advert.save(attributes, options);
			} else {
				this.advert.set(attributes);
				this.adverts.create(this.advert, options);
			}
		},
		cancel: function () {
			this.trigger("return");
		}
	});


	y4p.pages.CampaignFull = y4p.Page.extend({
		className: "campaign-full",
		events: {
			"click .cancel": "cancel",
			"click .submit": "submit"
		},
		initialize: function (options) {
			this.campaign = options.campaign;
			this.title = "Campaign: " + this.campaign.get("title");
		},
		render: function () {
			var that = this;
			this.$el.html(y4p.templates["campaign-full"](_.extend({
				allAdverts: this.options.app.adverts
			}, this.campaign.toJSON())));

			var map = this.locationMap = L.map(this.$("#tab-locations .map")[0]).setView([54.805, -3.59], 5);
			L.tileLayer('http://{s}.tile.cloudmade.com/1b189a705e22441c86cdb384a5bc7837/997/256/{z}/{x}/{y}.png', {
				attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
				maxZoom: 18
			}).addTo(map);
			setTimeout(function () { map.invalidateSize(); });

			var drawControl = new L.Control.Draw({
				position: 'topright',
				polyline: false
			});
			map.addControl(drawControl);

			this.$(".target-tabs a").click(function (e) {
				e.preventDefault();
				$(this).tab('show');
				map.invalidateSize();
			});

			return this;
		},
		submit: function (e) {
			var that = this,
				attributes = {
					title: this.$("#campaign-title").val(),
					startDate: this.$("#campaign-starts").val(),
					endDate: this.$("#campaign-ends").val(),
					adverts: _.map(this.$("#campaign-advert :checked"), function (el) {
						return Number($(el).val());
					})
				},
				options = {
					success: function () {
						that.$("form").html("Saved.");
					},
					error: function () {
						that.$("form").prepend("Error saving")
					}
				};
			if (this.campaign.has("id")) {
				this.campaign.save(attributes, options);
			} else {
				this.campaign.set(attributes);
				this.campaign.create(this.campaign, options);
			}
		},
		cancel: function () {
			this.trigger("return");
		}
	});

	y4p.TargetDialog = Backbone.View.extend({
		events: {
			"click .add": "add",
			"click .cancel": "hide"
		},
		initialize: function (options) {
			this.campaign = options.campaign;
		},
		render: function () {
			var that = this;
			this.$el.html(y4p.templates["target-dialog"]).find(".modal").modal();
			$('.modal').on('hidden', function () {
				that.remove();
			})
			return this;
		},
		add: function () {
			this.campaign.set({

			});
			this.hide();
			return this;
		},
		hide: function () {
			this.$('.modal').modal('hide');
			return this;
		},
		show: function () {
			this.$('.modal').modal('show');
			return this;
		}
	});

	y4p.OverlayApp = Backbone.View.extend({
		initialize: function () {
			this.adverts = new y4p.Adverts();
			//this.adverts.fetch();
		},
		render: function () {
			return this;
		},
		start: function () {
			var advert = this.adverts.get(Number(window.location.hash.substr(1)));
			if (advert) {
				$("body").html(advert.get("overlay"));
			}
			window.update = function (html) {
				console.log("hj", $("body"), html)
				$("body").html(html);
			}
			return this;
		}
	})

}(this))