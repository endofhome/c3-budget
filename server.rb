require 'sinatra'

unrequired_paths = ['.', '..', '.gitkeep']

get '/' do
  File.read(File.join('public', 'index.html'))
end

get '/budgets' do
  Dir.entries('public/budgets')
      .select { |e| !unrequired_paths.include? e }
      .map { |e| "<div>#{e}</div>" }
end

get '/actual-expenditure' do
  Dir.entries('public/actual-expenditure')
      .select { |e| !unrequired_paths.include? e }
      .map { |e| "<div>#{e}</div>" }
end