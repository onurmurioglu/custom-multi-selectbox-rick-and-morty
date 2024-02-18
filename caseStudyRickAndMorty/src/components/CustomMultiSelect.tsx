import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import CheckBox from 'react-native-check-box';
import {BASE_URL} from '@env';
import Icon from 'react-native-vector-icons/AntDesign';

interface Character {
  id: number;
  name: string;
  image: string;
  episode: string[];
  isChecked: boolean;
}

const CustomMultiSelect: React.FC = () => {
  const [selectedItems, setSelectedItems] = useState<Character[]>([]);
  const [searchText, setSearchText] = useState<string>('');
  const [data, setData] = useState<Character[]>([]);
  const [nextPage, setNextPage] = useState<string | null>();
  const [loading, setLoading] = useState<boolean>(false);
  const [notFound, setNotFound] = useState<boolean>(false);
  const inputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [searchedOnce, setSearchedOnce] = useState<boolean>(false);

  useEffect(() => {
    fetchData();
  }, [searchText]);

  const fetchData = () => {
    const apiUrl = `${BASE_URL}/?name=${searchText}`;

    console.log(BASE_URL === undefined);
    console.log('URL = ', apiUrl);

    fetch(apiUrl)
      .then(response => response.json())
      .then(json => {
        setLoading(false);
        if (json.results) {
          setNotFound(false);
          const updatedData: Character[] = json.results.map(
            (item: Character) => ({
              ...item,
              isChecked: selectedItems.some(
                selectedItem => selectedItem.id === item.id,
              ),
            }),
          );
          setData(updatedData);
          setNextPage(json.info.next);
        } else {
          setData([]);
          setNextPage(null);
          setNotFound(true);
        }
        if (!searchedOnce && searchText === '') {
          setSelectedItems([]);
        }
        setSearchedOnce(true);
      })
      .catch(error => {
        console.error(error);
        Alert.alert('Hata: ', error);
        setLoading(false);
      });
  };

  const toggleItem = (item: Character) => {
    const updatedItems = selectedItems.some(
      selectedItem => selectedItem.id === item.id,
    )
      ? selectedItems.filter(selectedItem => selectedItem.id !== item.id)
      : [...selectedItems, item];
    setSelectedItems(updatedItems);
    updateData(updatedItems);
  };

  const updateData = (updatedItems: Character[]) => {
    const updatedData = data.map(item => ({
      ...item,
      isChecked: updatedItems.some(selectedItem => selectedItem.id === item.id),
    }));
    setData(updatedData);
  };

  const removeItem = (item: Character) => {
    setSelectedItems(selectedItems.filter(i => i.id !== item.id));
    updateData(selectedItems.filter(i => i.id !== item.id));
    scrollViewRef.current?.scrollTo({x: -20, y: 0, animated: true});
  };

  const highlightMatches = (text: string, query: string) => {
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text;
    return (
      <>
        {text.substring(0, index)}
        <Text style={{fontWeight: 'bold'}}>
          {text.substring(index, index + query.length)}
        </Text>
        {text.substring(index + query.length)}
      </>
    );
  };

  const handleScroll = ({
    layoutMeasurement,
    contentOffset,
    contentSize,
  }: ScrollView) => {
    scrollViewRef.current?.scrollTo({
      x: 60,
      y: 0,
      animated: true,
    });

    if (layoutMeasurement && contentOffset && contentSize) {
      const paddingToBottom = 20;
      if (
        layoutMeasurement.height + contentOffset.y >=
        contentSize.height - paddingToBottom
      ) {
        if (nextPage) {
          setLoading(true);
          fetchData(nextPage);
        }
      }
    }
  };

  const handleInputChange = (text: string) => {
    setLoading(true);
    if (text.trim().length === -1) {
      setSearchText('');
      setSearchedOnce(false);
    } else {
      setSearchText(text);
    }
  };

  const renderLoader = () => {
    return (
      <View style={styles.loaderStyle}>
        {notFound ? (
          <Text>Eşleşen kayıt bulunamadı</Text>
        ) : (
          <ActivityIndicator size="large" color={'green'} />
        )}
      </View>
    );
  };

  const RenderItemComponent = React.memo(
    ({item, toggleItem, setSearchText, searchText}) => (
      <>
        <TouchableOpacity
          onPress={() => {
            toggleItem(item);
            setSearchText('');
          }}
          style={styles.option}>
          <CheckBox
            onClick={() => {
              toggleItem(item);
              setSearchText('');
            }}
            isChecked={item.isChecked}
            checkedCheckBoxColor="#0075FF"
            uncheckedCheckBoxColor="#868686"
            style={styles.checkbox}
          />
          <Image source={{uri: item.image}} style={styles.image} />
          <View style={styles.flatlistTexts}>
            <Text style={styles.name}>
              {highlightMatches(item.name, searchText)}
            </Text>
            <Text style={styles.episodeText}>
              {item.episode.length} Episodes
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.seperator}></View>
      </>
    ),
  );

  const loadMoreItem = () => {
    console.log('load More Item: ', nextPage);

    if (nextPage) {
      fetch(`${nextPage}`)
        .then(response => response.json())
        .then(res => {
          console.log('Result: ', res);
          console.log(res.info.next);

          const updatedData: Character[] = res.results.map(
            (item: Character) => ({
              ...item,
              isChecked: selectedItems.some(
                selectedItem => selectedItem.id === item.id,
              ),
            }),
          );
          setData([...data, ...updatedData]);
          setNextPage(res.info.next);
        })
        .catch(err => {
          console.error('Error: ', err);
          Alert.alert('Hata: ', err);
        });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal={true}
          onContentSizeChange={handleScroll}>
          {selectedItems.map((item, index) => (
            <View style={styles.tag} key={index}>
              <Text style={styles.tagText}>{item.name}</Text>
              <TouchableOpacity
                onPress={() => removeItem(item)}
                style={styles.tagRemove}>
                <Text style={styles.tagClose}>x</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder={selectedItems.length > 0 ? '' : 'Search...'}
            value={searchText}
            onChangeText={handleInputChange}
          />
        </ScrollView>
        <TouchableOpacity style={styles.okButton}>
          <Icon name="caretdown" size={15} color="#475569" />
        </TouchableOpacity>
      </View>
      <View style={styles.flatListContain}>
        {loading ? <ActivityIndicator size={'large'} color={'green'} /> : null}
        <FlatList
          data={data}
          renderItem={({item}) => (
            <RenderItemComponent
              item={item}
              toggleItem={toggleItem}
              setSearchText={setSearchText}
              searchText={searchText}
            />
          )}
          keyExtractor={(item, index) => index.toString()}
          style={styles.flatList}
          onEndReached={loadMoreItem}
          onEndReachedThreshold={0}
          ListFooterComponent={renderLoader}
          //ListHeaderComponent={renderLoader}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    padding: 10,
    backgroundColor: '#ffffff',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#94A3B8',
    borderRadius: 15,
    backgroundColor: '#ffffff',
    elevation: 20,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  input: {
    flex: 1,
    fontSize: 20,
    minWidth: 320,
    left: 5,
    color: 'black',
    fontWeight: '700',
  },
  tag: {
    flexDirection: 'row',
    justifyContent: 'center',
    top: 5,
    height: 37,
    backgroundColor: '#E2E8F0',
    borderRadius: 11,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginLeft: 6,
    textAlign: 'center',
  },
  tagText: {
    marginRight: 5,
    fontSize: 18,
    color: '#334155',
    fontWeight: '400',
  },
  tagClose: {
    fontWeight: '400',
    fontSize: 20,
    bottom: 3,
    color: '#F8FAFC',
    textAlign: 'center',
  },
  okButton: {
    padding: 10,
  },
  option: {
    borderColor: '#94A3B8',
    flexDirection: 'row',
    padding: 12,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginLeft: 15,
  },
  seperator: {
    width: '100%',
    height: 1,
    borderWidth: 0.8,
    borderColor: '#94A3B8',
  },

  flatListContain: {
    borderWidth: 2,
    height: '90%',
    borderRadius: 15,
    top: 15,
    borderColor: '#94A3B8',
  },
  flatList: {
    backgroundColor: '#F8FAFC',
    borderRadius: 15,
  },
  tagRemove: {
    backgroundColor: '#94A3B8',
    left: 2,
    borderRadius: 6,
    width: 25,
    height: 25,
    alignSelf: 'center',
  },
  flatlistTexts: {
    flexDirection: 'column',
    paddingLeft: 10,
  },
  name: {
    color: '#48566A',
    fontSize: 18,
  },
  episodeText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '400',
  },
  checkbox: {
    justifyContent: 'center',
  },
  loaderStyle: {
    marginVertical: 16,
    alignItems: 'center',
  },
});

export default CustomMultiSelect;
