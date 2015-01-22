(function(root, backboneFormset){
  backboneFormset(root.$, root._, root.Backbone);
}(this, function($, _, Backbone) {
  Backbone.FormsetView = Backbone.View.extend({
    constructor: function(options) {
      options = options || {};

      _.bindAll(this, 'render');
      Backbone.View.apply(this, arguments);

      // configuration defaults
      this.formPrefix = this.formPrefix || false; // prefix for your formset... usually from `formset.prefix`
      this.childElementSelectors = this.childElementSelectors || 'input,select,textarea,label,div';
      this.dynamicClass = this.dynamicClass || 'dynamic-form';
      this.addText = this.addText || 'add'; // Text for the add button
      this.addButtonSelector = this.addButtonSelector || ''; // if you want to use your own add button to add a new form
      this.addButtonHTML = this.addButtonHTML || '<button type="button">' + this.addText + '</button>'; // HTML used for add button
      this.deleteButtonHTML = this.deleteButtonHTML || '<a href="#">Delete</a>'; // HTML used for delete button
      this.totalFormsField = '#id_' + this.formPrefix + '-TOTAL_FORMS';
      this.maxFormsField = '#id_' + this.formPrefix + '-MAX_NUM_FORMS';
      this.addedCallback = this.addedCallback || ''; // callback called after form is added
      // callback called after form is removed
      if (!this.removedCallback){
        // if the user set removedCallback to false, lets leave it false
        if (!this.removedCallback === false){
          this.removedCallback = function(fieldset){
            fieldset.remove();
          }
        }
      }
      // end configuration 
    },
    updateElementIndex: function(elem, prefix, index) {
      var idRegex = new RegExp(prefix + '-(\\d+|__prefix__)-'); 
      var replacement = prefix + '-' + index + '-';
      if (elem.attr('for')) elem.attr('for', elem.attr('for').replace(idRegex, replacement));
      if (elem.attr('id')) elem.attr('id', elem.attr('id').replace(idRegex, replacement));
      if (elem.attr('name')) elem.attr('name', elem.attr('name').replace(idRegex, replacement));
      if (elem.attr('data-field-id')) elem.attr('data-field-id', elem.attr('data-field-id').replace(idRegex, replacement));
    },
    hasChildElements: function(fieldset) {
      return fieldset.find(this.childElementSelectors).length > 0;
    },
    showAddButton: function() {
      return (maxForms.val() == '' || (maxForms.val() - this.totalFormsField.val() > 0));
    },
    addClasses: function(){
      var self = this;
      this.$("fieldset").each(function() {
        if (self.hasChildElements($(this))) {
          $(this).addClass(self.dynamicClass);
        }
      });  
    },
    buildTemplate: function(){
      // call prepare delete buttons to sort out the delete fields for our template
      this.prepareDeleteFields();
      formTemplate = this.$('.' + this.dynamicClass + ':last').clone(true).removeAttr('id').removeAttr('readonly');
      this.clearAllFormFields(formTemplate);
      this.insertDeleteLink(formTemplate);
      return formTemplate;
    },
    // pass in a jQuery element
    clearAllFormFields: function(element){
      element.find(this.childElementSelectors).each(function() {
        if ($(this).is('input:checkbox') || $(this).is('input:radio')) {
          $(this).attr('checked', false);
        } else {
          if ($(this).is('textarea')) {
            $(this).text('');
          }
          $(this).val('');
        }
      });
    },
    prepareDeleteFields: function(){
      // deal with inline formset delete stuff if it exists
      this.$("fieldset").each(function() {
        // Django adds a checkbox to each form in the formset.
        // Replace the default checkbox with a hidden field:
        var fieldset = $(this);
        var deleteField = fieldset.find('input:checkbox[id $= "-DELETE"]');
        if (deleteField.length){
          if (deleteField.is(':checked')) {
            // If an inline formset containing deleted forms fails validation, make sure
            deleteField.replaceWith('<input type="hidden" name="' + deleteField.attr('name') +'" id="' + deleteField.attr('id') +'" value="on" />');
            fieldset.hide();
          } else {
            deleteField.replaceWith('<input type="hidden" name="' + deleteField.attr('name') +'" id="' + deleteField.attr('id') +'" />');
          }
          fieldset.find('label[for="' + deleteField.attr('id') + '"]').hide();
        }
      });
    },
    insertDeleteLink: function(fieldset){
      var deleteButton = $(this.deleteButtonHTML).addClass("remove-field");
      var totalFormsField = $(this.totalFormsField);
      var maxFormsField = $(this.maxFormsField);
      fieldset.append(deleteButton);
      var self = this;
      fieldset.on("click", ".remove-field", function(e) {
        e.preventDefault();
        var fieldset = $(this).parents('.' + self.dynamicClass);
        var deleteField = fieldset.find('input:hidden[id $= "-DELETE"]');
        //var buttonRow = fieldset.siblings("a.delete-row, ." + self.dynamicClass + '-add');
        var forms;
        fieldset.addClass("deleted").hide();
        if (deleteField.length) {
          // We're dealing with an inline formset.
          // Rather than remove this form from the DOM, we'll mark it as deleted
          // and hide it, then let Django handle the deleting:
          deleteField.val('on');
          forms = self.$('.' + self.dynamicClass).not(':hidden');
        } else {
          // fieldset.remove();
          // Update the TOTAL_FORMS count:
          forms = self.$('.' + self.dynamicClass).not('.formset-custom-template').not('deleted');
          totalFormsField.val(forms.length);
        }
        // Check if we need to show the add button:
        if (forms.length < maxFormsField.val()){
          self.addButton.show();
        }
        // If a post-delete callback was provided, call it with the deleted form:
        if (self.removedCallback) self.removedCallback(fieldset);
        return false;
      });
    },
    hideAddButton: function(){
    },
    renderDynamicForms: function(){
      if (!this.$("fieldset").length) return;
      var totalFormsField = $(this.totalFormsField);
      var maxFormsField = $(this.maxFormsField);

      this.formTemplate = this.formTemplate || this.buildTemplate();
      this.addClasses();

      // we set 'addButton' to the specified button or create one
      if (this.addButtonSelector) {
        this.addButton = $(this.addButtonSelector);
      } else {
        this.addButton = $(this.addButtonHTML);
        this.$("fieldset").last().after(this.addButton);
      }

      if (parseInt(totalFormsField.val()) >= parseInt(maxFormsField.val())){
        this.addButton.hide();
      }

      var self = this;
      this.addButton.on("click", function() {
        // get # of forms
        var formCount = parseInt($('#id_' + self.formPrefix + '-TOTAL_FORMS').val());
        var newForm = self.formTemplate.clone(true);

        // insert button after the last fieldset
        self.$("fieldset").last().after(newForm.show());

        newForm.find('input, select, textarea, label').each(function() {
          self.updateElementIndex($(this), self.formPrefix, formCount);
        });
         
        totalFormsField.val(formCount + 1);
        if (parseInt(totalFormsField.val()) >= parseInt(maxFormsField.val())){
          self.addButton.hide();
        }

        if (self.addedCallback) self.addedCallback(newForm);
      });

      this.$("fieldset").each(function() {
        var fieldset = $(this);
        if (self.hasChildElements(fieldset)) {
          fieldset.addClass(self.dynamicClass);
          if (fieldset.is(':visible')) {
            self.insertDeleteLink(fieldset);
          }
        }
      });
  }});
  return Backbone;
}));
