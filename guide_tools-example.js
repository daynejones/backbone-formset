var howchoo = howchoo || {};

howchoo.guideForm = (function(){
  var Model = {}, View = {}, Collection = {}, Router = {},
    model = {}, view = {}, collection = {}, router = {}, settings={};

  function init(config){
    settings = config;
    router.navigation = new Router.Navigation;
    Backbone.history.start();
  }

  /* Views */
  View.Form = Backbone.View.extend({
    el: "#guideFormContainer",
    events: {
      "submit form": "submit",
      "click .delete-guide": "deleteGuide"
    },

    initialize: function(){ 
      this.template = _.template($("#formTemplate").html());
    },

    render: function() {
      this.$el.html(this.template);
      return this;
    },

    renderChildren: function() {
      if (this.toolView) this.toolView.render();
      if (this.materialView) this.materialView.render();
      if (this.interestView) this.interestView.render();
      if (this.stepView){
        this.stepView.render();
        this.stepView.sort();
        this.stepView.initSortable();
      }
      return this;
    },

    showNoStepsMessage: function(){
      var firstStep = $(".step-fieldset").first();
      firstStep.find("input[name*='title']").parents(".form-group").addClass("has-error");
      $(".messages").stop().slideDown("slow").delay(2500).slideUp("slow");
      $(".messages").find(".error").text("You must have at least one step with a title.");
      var topPos = $("#stepFieldsets").offset().top - 120;
      $('html, body').animate({scrollTop:topPos}, '200', function(){
        firstStep.find("input[name*='title']").focus();
      });
    },

    deleteGuide: function(){
        var confirm = window.confirm("Are you sure you want to delete this guide permanently?");
        if (!confirm) return
        $.ajax({
          url: "/g/" + settings.guid + "/delete",
          type: "POST",
          data: {"delete": true}
        })
        .done(function(response){
          if (!response.error) {
            window.location = "/"
          }
        });
    },

    stepsValid: function(){
      var numSteps = this.$(".step-fieldset").length;
      // this grep returns all step fieldsets whose title field have a value
      var nonEmptyStepForms = $.grep(this.$(".step-fieldset"), function(stepFieldset){
        var step_title = $(stepFieldset).find("input[name*='title']").val();
        return step_title;
      });
      return nonEmptyStepForms.length;
    },

    submit: function(e){
      e.preventDefault();
      var formIsValid = true;

      if (view.form.stepView && !this.stepsValid()){
        this.showNoStepsMessage();
        formIsValid = false;
      }

      if (formIsValid) {
        $(e.target).get(0).submit();
      } else {
        return false;
      }
    }
  });

  /* Views */
  View.ChildForm = Backbone.FormsetView.extend({
    render: function() {
      //this.$el.html(_.template($(this.template).html()));
      this.$el.html(this.template);
      this.addClasses();
      this.renderDynamicForms();
      return this;
    }
  });

  View.ToolForm = View.ChildForm.extend({
    el: "#tools",
    template: _.template($("#toolFormTemplate").html()),
    deleteButtonHTML: '<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>',
    addButtonHTML: '<button type="button" class="btn btn-default">Add</button>',
    initialize: function(){
      this.formPrefix = settings.toolFormsetPrefix;
    }
  });

  View.MaterialForm = View.ChildForm.extend({
    el: "#materials",
    template: _.template($("#materialFormTemplate").html()),
    deleteButtonHTML: '<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>',
    addButtonHTML: '<button type="button" class="btn btn-default">Add Material</button>',
    initialize: function(){
      this.formPrefix = settings.materialFormsetPrefix;
    }
  });

  View.InterestForm = View.ChildForm.extend({
    el: "#interests",
    events: {
      "keydown input.name": "disallowSpaces",
      "change input.name": "removeSpaces"
    },
    template: _.template($("#interestFormTemplate").html()),
    deleteButtonHTML: '<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>',
    addButtonHTML: '<button type="button" class="btn btn-default">Add</button>',
    removedCallback: "",
    initialize: function(){
      this.formPrefix = settings.interestFormsetPrefix;
    },
    disallowSpaces: function(e){
      if (e.which == 32){
        return false;
      }
    },
    removeSpaces: function(e){
      $(e.target).val($(e.target).val().replace(/\s/g, ""));
    }
  });

  View.StepForm = View.ChildForm.extend({
    el: "#steps",
    template: _.template($("#stepFormTemplate").html()),
    addButtonSelector: "#addStepButton",
    deleteButtonHTML: '<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>',
    events: {
      "click .order-field-up": "moveStepUp",
      "click .order-field-down": "moveStepDown"
    },

    initialize: function(){
      this.formPrefix = settings.stepFormsetPrefix;
      this.addedCallback = this.sort;
      this.removedCallback = this.sort;
    },

    moveStepUp: function(e){
      var fieldset = $(e.target).closest("fieldset");
      var prevFieldset = fieldset.prev("fieldset");
      fieldset.after(prevFieldset);
      this.sort();
    },

    moveStepDown: function(e){
      var fieldset = $(e.target).closest("fieldset");
      var nextFieldset = fieldset.next("fieldset");
      fieldset.before(nextFieldset);
      this.sort();
    },

    initSortable: function(){
      var self = this;
      this.$(".step-fieldsets").sortable({
        axis: "y",
        cursorAt: {top: 40},
        handle: ".move-field",
        items: "> fieldset",
        placeholder: "step-placeholder",
        //tolerance: "pointer",
        start: function(){
          self.collapseSteps();
          $(this).sortable('refreshPositions');
        },
        stop: function(){
          self.expandSteps();
          self.sort();
        }
      });
    },

    collapseSteps: function(){
      //this.$(".step-fieldsets").height(this.$(".step-fieldsets").height());
      this.$("fieldset").find(".form-group:not(:first)").hide();
      this.$("fieldset").find(".hidden-form").hide();
    },

    expandSteps: function(){
      //this.$(".step-fieldsets").height("");
      this.$("fieldset").find(".form-group:not(:first)").show();
      this.$("fieldset").find(".hidden-form").show();
    },

    sort: function(){
      // this function sorts all of the step fieldsets
      // putting the new values into span.counter and the hidden input.order
      this.$("fieldset").not(".deleted").each(function(index){
        index++;
        $(this).find("input.order").val(index);
        $(this).find("span.counter").text(index);
      });
      this.showHideOrderAndDelete();
    },

    showHideOrderAndDelete: function(){
      var visibleFieldsets = this.$("fieldset").not(".deleted");
      visibleFieldsets.find(".order-field-up").show().first().hide();
      visibleFieldsets.find(".order-field-down").show().last().hide();
      if (visibleFieldsets.length > 1){
        visibleFieldsets.find(".remove-field").show();
      } else {
        visibleFieldsets.find(".remove-field").hide();
      }
    }

  });

  /* ROUTER */
  Router.Navigation = Backbone.Router.extend({
    routes: {
      "": "index"
    },

    index: function(){
      view.form = new View.Form;
      view.form.render();

      // instantiate child views
      if (settings.toolFormsetPrefix){
        view.form.toolView = new View.ToolForm;
      }
      if (settings.materialFormsetPrefix){
        view.form.materialView = new View.MaterialForm;
      }
      if (settings.interestFormsetPrefix){
        view.form.interestView = new View.InterestForm;
      }
      if (settings.stepFormsetPrefix){
        view.form.stepView = new View.StepForm;
      }

      // call method that renders all child forms
      view.form.renderChildren();
    },
  });

  return {
    init: init
  }
})();
