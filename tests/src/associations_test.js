module('Associations test', {
    setup: function() {
        window.Foo = Ember.Namespace.create();
        Foo.store = Syrah.Store.create({ds: Syrah.IdentityDataSource.create()});
        Foo.Phone = Syrah.Model.define({
            type: String,
            number: String
        });
        Foo.Contact = Syrah.Model.define({
            name: String,
            phones: {
                type: Syrah.HasMany,
                itemType: Foo.Phone
            }
        });
        Foo.Author = Syrah.Model.define({
            name: String
        });
        Foo.Blog = Syrah.Model.define({
            title: String,
            author: Foo.Author
        });
        Foo.Post = Syrah.Model.define({
            title: String,
            content: String,
            comments: {
                type: Syrah.HasMany,
                itemType: "Foo.Comment",
                inverseOf: 'post'
            }
        });
        Foo.Comment = Syrah.Model.define({
            author: String,
            content: String,
            post: {
                type: Foo.Post,
                inverseOf: 'comments'
            }
        });
    }
});

test("A model has a getAssociations() method that list the defined associations", function() {
    var c = Foo.Contact.create();
    deepEqual(Ember.keys(c.getAssociations()), ['phones']);
});

test("HasMany association definition", function() {
    var c = Foo.Contact.create();
    ok(c.get('phones') instanceof Syrah.HasMany, "A collection property has been set");
});

test("HasMany association usage", function() {
    var contact = Foo.Contact.create({ id: 1234, firstname: 'John', lastname: 'Doe' });
    var phone = Foo.Phone.create({ type: 'mobile', number: '+123456' });
    ok(contact.get('phones').get('owner') !== undefined, "A HasMany collection should maintain a link to its owner");
    equal(contact.get('phones').get('owner').get('firstname'), 'John', "A HasMany collection should maintain a link to its owner");

    contact.get('phones').pushObject(phone);
    equal(contact.get('phones').objectAt(0).getDbRef('contact_id'), 1234, "An object in a HasMany collection should maintain a DbRef to its owner ID");

    var contact2 = Foo.Contact.create({ id: 5678, firstname: 'Jane', lastname: 'Doe' });
    equal(contact2.get('phones').get('length'), 0, "Different objects should have different HasMany collections");
});

test("BelongsTo association usage", function() {
    var blog = Foo.Blog.create({ title: 'Ember & JS' });
    var author = Foo.Author.create({ id: 5678, name: 'John Doe' });
    equal(blog.get('author').get('isLoaded'), false);

    blog.set('author', author);

    equal(blog.getDbRef('author_id'), 5678, "An object should maintain a FK to the object it belongs to");
    equal(blog.get('author').get('name'), 'John Doe', "The object it belongs to can be retrieved");

    var anonymousBlog = Foo.Blog.create({ title: 'Ember & JS', author: null });
    equal(anonymousBlog.get('author'), null);
});

test("Bi-directional associations", function() {
    var post = Foo.Post.create({ title: 'Javascript rulez !' });
    var comment = Foo.Comment.create({ author: 'jdoe', content: 'I agree !' });
    post.get('comments').pushObject(comment);

    equal(comment.get('post').get('title'), post.get('title'), "Inverseof a HasMany association should be set when an object is pushed");

    var comment2 = Foo.Comment.create({ author: 'jane', content: 'I disagree !' });
    comment2.set('post', post);

    equal(post.get('comments').get('length'), 2);
    equal(post.get('comments').objectAt(1).get('author'), 'jane');
});

test("Computed properties dependent of associations", function() {
    Foo.Post.reopen({
        publishedComments: function() {
            return this.get('comments').filterProperty('published', true);
        }.property('comments.@each.published')
    });
    var post = Foo.Post.create({ title: 'Javascript rulez !' });
    post.get('comments').pushObject(Foo.Comment.create({ author: 'jdoe', content: 'I agree !', published: true }));

    equal(post.get('publishedComments').get('length'), 1);
});