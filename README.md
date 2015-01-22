# backbone-formset
This is a backbone plugin designed to work with Django's formsets.

Include this file then extend FormSetView like so:

View.MyForm = Backbone.FormsetView.extend({})

## Options

formPrefix: prefix for your formset... usually from `{{ formset.prefix }}` in your template

dynamicClass: class used to indicate a form that has been added dynamically. default is 'dynamic-form'

addText: Text used for the add button. default is 'Add'

addButtonSelector: if you want to use your own existing add button to add a new form

addButtonHTML: HTML used for add button. default is '<button type="button">' + this.addText + '</button>'

deleteButtonHTML: HTML used for delete button. default is '<a href="#">Delete</a>'

addedCallback = callback called after form is added. default is ''
