const got = require('@/utils/got');
const { parseDate } = require('@/utils/parse-date');
const timezone = require('@/utils/timezone');

// http://www.2cycd.com/forum.php?mod=forumdisplay&fid=43&orderby=dateline

module.exports = async (ctx) => {
    // const fid = ctx.params.fid ?? '43';
    // const sort = ctx.params.sort ?? 'dateline';

    const rootUrl = 'https://www.pexels.com/api/v2/feed';

    const response = await got(rootUrl, {
        headers: {
            'secret-key': 'H2jk9uKnhRmL6WPwh89zBezWvr',
        },
        responseType: 'json',
    });
    let list = response.data.data || []; // .data;

    const pagination = response.data.pagination;
    // 每次查询两页
    if (pagination && pagination.more_data === true) {
        const currentUrl = `${rootUrl}?seed=${pagination.cursor}`;
        const srp = await got(currentUrl, {
            headers: {
                'secret-key': 'H2jk9uKnhRmL6WPwh89zBezWvr',
            },
            responseType: 'json',
        });
        list = list.concat(srp.data.data || []);
    }

    // eslint-disable-next-line no-console
    console.log('list:::', list.length);

    const title = 'pexel trending ' + new Date().toDateString();

    const items = list.map((item) => {
        item.pubDate = timezone(parseDate(item.attributes.feed_at, 'YYYY-M-D HH:mm:ss'), +8);
        item.title = item.attributes.title || '' + ' ' + item.attributes.slug || '';
        item.description = `<img src='${item.attributes.image.small}'><br>
                        <img src='${item.attributes.image.medium}'><br>
                        <img src='${item.attributes.image.large}'><br>
                        <img src='${item.attributes.image.download}'><br>
                        <img src='${item.attributes.image.download_link}'><br>`;
        item.link = item.attributes.image.download;
        item.author = item.attributes.user.username;
        item.avatar = item.attributes.user.avatar.small;
        return item;
    });
    // eslint-disable-next-line no-console
    // console.log(items);

    // const $ = cheerio.load(iconv.decode(response.data, 'gbk'));
    //
    // const list = $('tbody[id^="normalthread_"]')
    //     .map((_, item) => {
    //         item = $(item);
    //         const xst = item.find('a.s.xst');
    //         const author = item.find('td.by cite a').eq(0).text();
    //         return {
    //             title: xst.text(),
    //             link: xst.attr('href'),
    //             author,
    //         };
    //     })
    //     .get();
    // // console.log(list);
    // const items = await Promise.all(
    //     list.map((item) =>
    //         ctx.cache.tryGet(item.link, async () => {
    //             const detailResponse = await got(item.link, {
    //                 responseType: 'buffer',
    //             });
    //
    //             const content = cheerio.load(iconv.decode(detailResponse.data, 'gbk'));
    //             const first_post = content('td[id^="postmessage_"]').first();
    //             const dateobj = content('em[id^="authorposton"]').first();
    //             item.description = first_post.html();
    //             item.pubDate = timezone(parseDate(dateobj.find('span').attr('title'), 'YYYY-M-D HH:mm:ss'), +8);
    //
    //             return item;
    //         })
    //     )
    // );
    ctx.state.data = {
        title, // $('title').text(),
        link: rootUrl,
        item: items,
    };
};
