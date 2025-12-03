import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { api } from '../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen({ navigation }: any) {
    const [media, setMedia] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMedia();
    }, []);

    const loadMedia = async () => {
        try {
            const data = await api.get('/api/media');
            setMedia(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity style={styles.card}>
            <Image
                source={{ uri: `https://image.tmdb.org/t/p/w500${item.posterPath}` }}
                style={styles.poster}
            />
            <View style={styles.info}>
                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.type}>{item.type === 'MOVIE' ? 'Film' : 'Serie'}</Text>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#06b6d4" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Meine Liste</Text>
            </View>
            <FlatList
                data={media}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerStyle={styles.grid}
                columnWrapperStyle={styles.row}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f1115',
    },
    center: {
        flex: 1,
        backgroundColor: '#0f1115',
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#1e293b',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    grid: {
        padding: 10,
    },
    row: {
        justifyContent: 'space-between',
    },
    card: {
        width: '48%',
        marginBottom: 15,
        backgroundColor: '#1e293b',
        borderRadius: 12,
        overflow: 'hidden',
    },
    poster: {
        width: '100%',
        aspectRatio: 2 / 3,
    },
    info: {
        padding: 10,
    },
    title: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
        marginBottom: 4,
    },
    type: {
        color: '#94a3b8',
        fontSize: 12,
    },
});
