import React, {PureComponent} from 'react';
import cs from 'classnames';

import Category from './Component/Exclusive/Category';
import Tip from './Component/Exclusive/Tip';
import Status from './Component/Exclusive/Status';
import Input from './Component/Common/Input';
import UndoList from './Component/Exclusive/UndoList';
import Tool, {ToolBtn} from './Component/Exclusive/Tool';
import Uploader, {ACCEPT_TYPE} from "./Component/Common/Uploader";
import ToolTip from './Component/Common/ToolTip';

import TODO_CONFIG from './config';
import fileHelper from './tool/file';
import {stringify, parse, copy} from './tool/json';

import './app.scss';
import './icon/icons.scss';
import parser from "./tool/parser";

const store = window.localStorage;

const ANIMATE = {
    INSERT_TODO: 'bounceIn',
    INSERT_DONE: 'slideInDown',
};

// 从配置中读取信息
const {
    CATEGORY_LIST, LIMIT_WORDS,
    STORE_TODO_KEY, STORE_DONE_KEY, STORE_CATEGORY_KEY,
    RENDER_ACTIVE_KEY, RENDER_PARSE_KEY, RENDER_STRING_KEY
} = TODO_CONFIG;
const LIST_KEYS = [STORE_TODO_KEY, STORE_DONE_KEY];
const INIT_CATEGORY_KEY = CATEGORY_LIST[0].key;

// 性能打桩
const TIME_KEY = {
    TEST_PARSER: '【解析数据】解析输入文本耗时：',
    ALL_DATA_READ_AND_RENDER: '【所有数据】读取 & 渲染耗时：',
    ALL_LIST_READ_AND_RENDER: '【列表数据】读取 & 渲染耗时：',
};

const getRealStoreKey = function (category, key) {
    return `__${category}_${key}`;
};

const getAntiStoreKey = function (storeKey) {
    return storeKey === STORE_TODO_KEY ? STORE_DONE_KEY : STORE_TODO_KEY;
};

class App extends PureComponent {
    state = {
        [STORE_TODO_KEY]: [], // 未完成的消息
        [STORE_DONE_KEY]: [], // 已经完成的消息
        focus: '', // input是否focus
        category: CATEGORY_LIST, // 总分类
        categoryKey: INIT_CATEGORY_KEY, // 当前激活的分类
        openTool: false, // 打开工具栏
        enableAnimate: false, // 禁用动画
        todoEnterAnimate: '',
    };

    componentDidMount() {
        this._readData(() => {
            this.brieflyCloseAnimate();
        });
    }

    __testRender() {
        // console.time(TIME_KEY.TEST_PARSER);
        // const str = '>2d 13:20 [A, B] 所有的[格式](www.baidu.com) *能* **否** ***正*** `常` ~~展~~ 示？';
        // const testTimes = 100;
        // for(let i=0; i< testTimes; i++) {
        //     parser.parse(str);
        // }
        // for(let i = 0; i< testTimes; i++) {
        //     setTimeout(() => {
        //         return this.insertOneData({
        //             value: i + str + i
        //         }, STORE_DONE_KEY, false);
        //     }, 100 * i);
        // }
        // console.timeEnd(TIME_KEY.TEST_PARSER);
    }

    // 从持久化中读取数据
    _readData = (callback) => {
        console.time(TIME_KEY.ALL_DATA_READ_AND_RENDER);
        const category = parse(store.getItem(STORE_CATEGORY_KEY), CATEGORY_LIST);
        const categoryKey = category[0].key;
        console.time(TIME_KEY.ALL_LIST_READ_AND_RENDER);
        this._readList(callback);
        this.setState({
            category,
            categoryKey,
            openTool: false,
        }, () => {
            console.timeEnd(TIME_KEY.ALL_DATA_READ_AND_RENDER);
            console.timeEnd(TIME_KEY.ALL_LIST_READ_AND_RENDER);
        });
    };
    // 读取每列数据
    _readList = (callback) => {
        const {categoryKey} = this.state;
        LIST_KEYS.forEach((eachKey) => {
            const storeKey = getRealStoreKey(categoryKey, eachKey);
            const tempData = parse(store.getItem(storeKey), []);
            tempData.forEach(function (eachData) {
                if (!eachData[RENDER_PARSE_KEY]) {
                    eachData[RENDER_PARSE_KEY] = parser.parse(eachData.value);
                    eachData[RENDER_STRING_KEY] = eachData[RENDER_PARSE_KEY][0][RENDER_STRING_KEY];
                }
            });
            this.setState({
                [eachKey]: tempData
            });
        });
        callback && callback();
    };

    /**
     * 对列表进行相关的数据操作 Start
     */
    insertOneData = (data, storeKey, isEnter) => {
        const {categoryKey} = this.state;
        const preData = this.state[storeKey];

        // 解析该行命令
        const newData = [...preData];
        if (!data[RENDER_PARSE_KEY]) {
            data[RENDER_PARSE_KEY] = parser.parse(data.value);
        }
        // 假如之前是激活状态，则不再激活该list（作用域切换）
        if (data[RENDER_ACTIVE_KEY] === true) {
            data[RENDER_ACTIVE_KEY] = false;
        }
        if (!data[RENDER_STRING_KEY]) {
            data[RENDER_STRING_KEY] = data[RENDER_PARSE_KEY][0][RENDER_STRING_KEY];
        }

        // 校验数据是否合法
        const {tip, index} = Tip.getTip(data[RENDER_STRING_KEY], newData, !isEnter);
        if (tip) {
            Tip.showTip(tip);
            if (index >= 0) {
                this.handleActive(index, storeKey, true);
            }
            return false;
        }
        if (isEnter === true) {
            const antiStoreKey = getAntiStoreKey(storeKey);
            const antiData = this.state[antiStoreKey];
            const {tip: antiTip, index} = Tip.getTip(data[RENDER_STRING_KEY], antiData, true);
            if (antiTip) {
                Tip.showTip(antiTip);
                if (index >= 0) {
                    this.handleActive(index, antiStoreKey, true);
                }
                return false;
            }
        }

        // 更改数据
        newData.unshift(data);
        const realStoreKey = getRealStoreKey(categoryKey, storeKey);
        store.setItem(realStoreKey, stringify(newData));
        this.setState({
            [storeKey]: newData,
        });
        return true;
    };
    // 完成或未完成列表
    toggleOneData = (index, value, storeKey) => {
        const preData = this.state[storeKey];
        const antiKey = getAntiStoreKey(storeKey);
        const deleteOneData = preData[index];
        if (this.insertOneData(deleteOneData, antiKey)) {
            this.deleteOneData(index, storeKey, true);
        }
    };
    // 删除列表
    deleteOneData = (index, storeKey, enableAnimate) => {
        const {categoryKey} = this.state;
        const preData = this.state[storeKey];
        const newData = [...preData];
        newData.splice(index, 1);
        const realStoreKey = getRealStoreKey(categoryKey, storeKey);
        store.setItem(realStoreKey, stringify(newData));
        if (enableAnimate !== true) {
            this.brieflyCloseAnimate();
        }
        this.setState({
            [storeKey]: newData
        });
    };
    dragData = (listData, storeKey) => {
        const {categoryKey} = this.state;
        this.setState({
            [storeKey]: [...listData]
        });
        const realStoreKey = getRealStoreKey(categoryKey, storeKey);
        store.setItem(realStoreKey, stringify(listData));
    };

    /**
     * 对列表进行相关的数据操作 END
     */

    /**
     * 前端交互事件 START
     */
        // 摇动一个数据以引起别人注意
    handleActive = (index, storeKey, tempShake) => {
        const preData = this.state[storeKey];
        const newData = copy(preData);
        let tempData = newData[index];
        tempData[RENDER_ACTIVE_KEY] = true;
        this.setState({
            [storeKey]: [...newData]
        });
        if(tempShake === true) {
            setTimeout(() => {
                this.brieflyCloseAnimate();
                let newTempData = copy(tempData);
                newTempData[RENDER_ACTIVE_KEY] = false;
                newData[index] = newTempData;
                this.setState({
                    [storeKey]: [...newData]
                })
            }, 1000);
        }
    };
    // 短暂关闭动画
    brieflyCloseAnimate = () => {
        this.setState({
            enableAnimate: false,
        });
        setTimeout(() => {
            this.setState({
                enableAnimate: true,
            })
        }, 100);
    };
    changeCategory = (key) => {
        this.setState({
            categoryKey: key,
        }, () => {
            this._readList();
            this.brieflyCloseAnimate();
        });
    };
    handleSave = () => {
        const {category} = this.state;
        let saveObj = {};
        saveObj.category = category;
        saveObj.data = {};
        category.forEach((eachCategory) => {
            const {key} = eachCategory;
            LIST_KEYS.forEach(function (eachKey) {
                const tempStoreKey = getRealStoreKey(key, eachKey);
                saveObj.data[tempStoreKey] = parse(store.getItem(tempStoreKey), []);
            });
        });
        fileHelper.save('config.json', JSON.stringify(saveObj));
    };
    handleRead = (readObj) => {
        const category = readObj.category;
        const data = readObj.data;
        store.setItem(STORE_CATEGORY_KEY, JSON.stringify(category));
        let keys = Object.keys(data);
        keys.forEach(function (eachKey) {
            store.setItem(eachKey, stringify(data[eachKey]));
        });
        this._readData(function () {
            Tip.showTip('读取成功')
        });
    };
    handleInputFocus = () => {
        this.setState({focus: true});
    };
    handleInputBlur = () => {
        this.setState({focus: false});
    };
    handleInputEnter = (value) => {
        return this.insertOneData({
            value
        }, STORE_TODO_KEY, true);
    };
    handleToggleTool = () => {
        const {openTool} = this.state;
        this.setState({
            openTool: !openTool
        })
    };

    /**
     * 前端交互事件 END
     */

    render() {
        const {focus, category, categoryKey, openTool, enableAnimate, todoEnterAnimate} = this.state;
        const todoData = this.state[STORE_TODO_KEY];
        const doneData = this.state[STORE_DONE_KEY];
        return (
            <div id="todo-app" tabIndex="0">
                <div className={cs('app-wrapper', {'open-tool': openTool})}>

                    {/* 分类 */}
                    <Category activeKey={categoryKey}
                              options={category}
                              onChange={this.changeCategory}/>
                    {/* 其它提示 */}
                    <Tip/>
                    {/* 当前状态栏 */}
                    <Status length={todoData.length} onClick={this.handleToggleTool} isActive={openTool}/>
                    {/* 列表 */}
                    <div className={cs('list-container', {'focus': focus})}>
                        <UndoList
                            id='undo'
                            storeKey={STORE_TODO_KEY}
                            className={cs('undo-list')}
                            list={todoData}
                            checked={false}
                            placeholder={"不来一发吗?"}
                            enterActive={todoEnterAnimate}
                            transitionEnter={enableAnimate}
                            transitionLeave={false}
                            onSelect={this.toggleOneData}
                            onDelete={this.deleteOneData}
                            onDrag={this.dragData}
                            onActive={this.handleActive}/>
                        {
                            doneData.length > 0 &&
                            <div className="done-split"/>
                        }
                        <UndoList
                            id='done'
                            storeKey={STORE_DONE_KEY}
                            className={cs('done-list')}
                            checked small
                            list={doneData}
                            enterActive={ANIMATE.INSERT_DONE}
                            transitionEnter={enableAnimate}
                            transitionLeave={false}
                            onSelect={this.toggleOneData}
                            onDelete={this.deleteOneData}/>
                    </div>

                    {/* 输入框 */}
                    <Input
                        className={cs({"focus": focus})}
                        max={LIMIT_WORDS}
                        onFocus={this.handleInputFocus}
                        onBlur={this.handleInputBlur}
                        onEnter={this.handleInputEnter}/>
                </div>
                <Tool isActive={openTool} onClose={this.handleToggleTool}>
                    <ToolTip title="导出配置">
                        <ToolBtn type='download' onClick={this.handleSave}/>
                    </ToolTip>
                    <ToolTip title="导入配置">
                        <Uploader type={ACCEPT_TYPE.JSON} onChange={this.handleRead}>
                            <ToolBtn type='upload'/>
                        </Uploader>
                    </ToolTip>
                </Tool>
            </div>
        );
    }
}

export default App;