const path = require('path')
const fs = require('fs')
const renderMarkdown = require('./renderMarkdown')

module.exports = app => {

  app.use((request, response, next) => {

    response.path = request.url
    response.locals.path = response.path

    response.renderNotFound = function(){
      response
        .status(404)
        .render('not_found')
    }

    response.renderError = function(error){
      response.status(error.status || 500).send(error.message)
    }

    response.renderServerError = function(error){
      error.status = 500
      response.renderError(error)
    }

    response.renderMarkdownFile = function(relativeFilePath=request.path){
      const absoluteFilePath = path.resolve(__dirname, '..', '.'+relativeFilePath)
      fs.readFile(absoluteFilePath, (error, file) => {
        if (error){
          if (error.message.includes('ENOENT')){
            response.renderNotFound()
          }else if (error.message.includes('EISDIR')){
            response.renderMarkdownFile(request.path+'/README.md')
          }else{
            response.renderServerError(error)
          }
          return
        }
        response.renderMarkdown(file.toString())
      })
    }

    response.renderMarkdown = function(markdown){

      renderMarkdown(markdown, (error, content) => {
        if (error) return response.renderServerError(error)

        const file = {
          content,
          sourceUrl: 'https://github.com/GuildCrafts/curriculum/blob/master'+response.path,
          editeUrl: 'https://github.com/GuildCrafts/curriculum/edit/master'+response.path,
        }
        response.render('markdown', file)
      })
    }

    next()
  })

}