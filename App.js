import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import { theme } from './colors';
import { AntDesign, Feather } from '@expo/vector-icons';

const STORAGE_KEY = "@toDos";

export default function App() {

  //AsyncStorage.clear();
  
  const [category, setCategory] = useState(true); //categories (work/travel)
  const [state, setState] = useState(false);  //state (false/true)
  const [text, setText] = useState(""); //input text ""
  const [toDos, setToDos] = useState({}); //todo Object List {}
  const [loading, setLoading] = useState(false);
  const work = () => setCategory(true);
  const travel = () => setCategory(false);

  useEffect( () => {
    loadToDos();
  }, []);

  //toDo를 스와이프 했을 때 생성되는 컴포넌트 
  const swipeComp = (key) => (
    <>
      <TouchableOpacity onPress={() => deleteToDo(key)}>
        <AntDesign style={styles.toDoSwipe} name="delete" size={16} backgroundColor='red'/>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => modifyToDo(key)}>
        <Feather style={styles.toDoSwipe} name="edit-3" size={16} backgroundColor='grey'/>
      </TouchableOpacity>
    </>
  );

  //스토리지에서 데이터를 로드 
  const loadToDos = async () => { 
    try {
      const storageItems = await AsyncStorage.getItem(STORAGE_KEY);
      if (storageItems === null) {
        console.log("스토리지에서 불러올 데이터가 없습니다.");
      } else {
        setToDos(JSON.parse(storageItems)); //불러온 데이터를 javascript Object로 parse 후, 목록에 넣어준다.
        //console.log("스토리지에서 데이터를 성공적으로 불러왔습니다.");
      }
      setLoading(true);
    } catch (e) {
      console.log("스토리지에서 데이터를 불러오는데에 실패하였습니다.");
    }
  };

  //휘발되지 않도록 스토리지에 데이터를 저장
  const saveToDos = async (toSave) => { 
    try {
      if (toSave !== null){
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));  //stringify
        //console.log("스토리지에 데이터 저장을 성공하였습니다.");
      }
    } catch (e) {
      console.log("스토리지에 데이터 저장을 실패하였습니다.");
    }
  };

  //TextInput에 입력한 데이터를 text에 설정
  const onChangeText = (enter) => setText(enter); 

  //toDos에 text와 category,state를 newToDos로 묶어 입력
  const addToDo = async () => { 
    if (text === ""){
      return;
    }
    /*
    * //방법1. Object.assign()
    * const newToDos = Object.assign({}, toDos, {
    *   [Date.now()] : {text, category : category, state : false}
    * });
    */
    //방법2. ECMAScript6 (ES6) ...으로 toDos의 Object 내용을 받아올 수 있다.
    const newToDos = {
      ...toDos,
      [Date.now()] : {text, category, state : false},
    };
    setToDos(newToDos);   //toDos에 데이터를 입력해준다.
    await saveToDos(newToDos);  //스토리지에 데이터를 저장하기위해 saveToDos로 데이터를 보내준다.
    setText("");  //TextInput을 초기화 해준다.
  };

  //toDo의 state 변경 토글 함수
  const toggleState = (key) => {
    const newToDos = {...toDos};
    const temp = newToDos[key].state;
    newToDos[key].state = !temp; //true는 false, false는 true
    setToDos(newToDos);
    saveToDos(newToDos);
  }

  //toDo의 text 데이터 수정 함수
  const modifyToDo = (key) => {
    Alert.prompt( //Only iOS
      "Modify To Do", 
      "What do you want to change it to?",
      [{text : "Cancel"}, 
        {text : "Done",
        onPress : (value) => {
          const newToDos = {
            ...toDos,
            [key] : {text : value, category, state},
          };
          setToDos(newToDos);
          saveToDos(newToDos);
        }}],
      "plain-text",
      toDos[key].text
    );
  }

  //toDo 데이터 삭제 함수
  const deleteToDo = (key) => {
    Alert.alert(
      "Delete To Do", 
      "Are you sure?", 
      [{text : "Cancel"},
        {text : "I'm Sure", 
          style : "destructive", //Only iOS
          onPress : () => {
            const newToDos = {...toDos};
            delete newToDos[key];
            setToDos(newToDos);
            saveToDos(newToDos);
        }}],
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity onPress={work}>
          <Text style={{...styles.btnText, color : category ? theme.white : theme.grey}}>Work</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={travel}>
          <Text style={{...styles.btnText, color : !category ? theme.white : theme.grey}}>Travel</Text>
        </TouchableOpacity>
      </View>
      <View>
        <TextInput 
          placeholder={category ? "Add a To Do!" : "Where do you want to go?"} 
          onChangeText={onChangeText}
          value={text}
          onSubmitEditing={addToDo}
          returnKeyType='done'
          style={styles.input}
        />
          {!loading ? (
              <ActivityIndicator color="white" size="large"/>
            ) : (
              <ScrollView>
                <GestureHandlerRootView>
                  {Object.keys(toDos).map((key) => 
                    toDos[key].category === category ? (
                        <Swipeable
                          renderRightActions={() => swipeComp(key)}
                          overshootRight={false}
                          key={key}
                        >
                          <Pressable onPress={() => toggleState(key)} style={styles.toDo}>
                            {toDos[key].state ? (<Feather name="check-circle" size={24} color={theme.grey} />) : (<Feather name="circle" size={24} color={theme.white} />)}
                            <Text style={toDos[key].state ? styles.doneText : styles.toDoText}>{toDos[key].text}</Text>
                          </Pressable>
                        </Swipeable>
                    ) : null
                  )}
                </GestureHandlerRootView>
              </ScrollView>
            )
          }
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
    paddingHorizontal : 20,
  },
  header : {
    justifyContent : 'space-between',
    flexDirection : 'row',
    marginTop : 100,
  },
  btnText : {
    fontSize : 38,
    fontWeight : '600',
  },
  input : {
    backgroundColor : theme.white,
    paddingVertical : 15,
    paddingHorizontal : 20,
    marginVertical : 20,
    fontSize : 18,
  },
  toDo : {
    backgroundColor :theme.toDoBg,
    flexDirection : 'row',
    alignItems : 'center',
    justifyContent : 'space-between',
    marginBottom : 10,
    paddingVertical : 20,
    paddingHorizontal : 30,
  },
  toDoText : {
    color : theme.white,
    fontSize : 16,
  },
  doneText : {
    color : theme.grey,
    fontSize : 16,
    textDecorationLine: 'line-through'
  },
  toDoSwipe : {
    color : theme.white,
    width : 80,
    marginBottom : 10,
    paddingVertical : 20,
    paddingHorizontal : 30,
  },
});
